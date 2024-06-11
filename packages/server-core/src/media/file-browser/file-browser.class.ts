/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { NullableId, Paginated, ServiceInterface } from '@feathersjs/feathers/lib/declarations'
import { KnexAdapterParams } from '@feathersjs/knex'
import appRootPath from 'app-root-path'
import fs from 'fs'
import { Knex } from 'knex'
import path from 'path/posix'

import { projectPath, ProjectType } from '@etherealengine/common/src/schema.type.module'
import {
  FileBrowserContentType,
  FileBrowserPatch,
  FileBrowserUpdate
} from '@etherealengine/common/src/schemas/media/file-browser.schema'
import { invalidationPath } from '@etherealengine/common/src/schemas/media/invalidation.schema'
import { staticResourcePath, StaticResourceType } from '@etherealengine/common/src/schemas/media/static-resource.schema'
import {
  projectPermissionPath,
  ProjectPermissionType
} from '@etherealengine/common/src/schemas/projects/project-permission.schema'
import { checkScope } from '@etherealengine/spatial/src/common/functions/checkScope'

import { Application } from '../../../declarations'
import config from '../../appconfig'
import { getContentType } from '../../util/fileUtils'
import { getIncrementalName } from '../FileUtil'
import { getStorageProvider } from '../storageprovider/storageprovider'
import { StorageObjectInterface } from '../storageprovider/storageprovider.interface'
import { uploadStaticResource } from './file-helper'

export const projectsRootFolder = path.join(appRootPath.path, 'packages/projects')

export interface FileBrowserParams extends KnexAdapterParams {}

const ensureProjectsDirectory = (directory: string) => {
  if (!directory.startsWith('projects')) throw new Error('Not allowed to access this directory')
}

/**
 * A class for File Browser service
 */
export class FileBrowserService
  implements
    ServiceInterface<
      boolean | StaticResourceType | Paginated<FileBrowserContentType>,
      string | FileBrowserUpdate | FileBrowserPatch,
      FileBrowserParams,
      FileBrowserPatch
    >
{
  app: Application

  constructor(app: Application) {
    this.app = app
  }

  /**
   * Returns the metadata for a single file or directory
   */
  async get(key: string, params?: FileBrowserParams) {
    if (!key) return false
    const storageProvider = getStorageProvider()
    const [_, directory, file] = /(.*)\/([^\\\/]+$)/.exec(key)!

    ensureProjectsDirectory(directory)

    return await storageProvider.doesExist(file, directory)
  }

  /**
   * Return the metadata for each file in a directory
   */
  async find(params?: FileBrowserParams) {
    if (!params) params = {}
    if (!params.query) params.query = {}
    const { $skip, $limit } = params.query
    let { directory } = params.query

    const skip = $skip ? $skip : 0
    const limit = $limit ? $limit : 100

    const storageProvider = getStorageProvider()
    const isAdmin = params.user && (await checkScope(params.user, 'admin', 'admin'))
    if (directory[0] === '/') directory = directory.slice(1)

    ensureProjectsDirectory(directory)

    let result = await storageProvider.listFolderContent(directory)
    Object.entries(params.query).forEach(([key, value]) => {
      if (value['$like']) {
        const searchString = value['$like'].replace(/%/g, '')
        result = result.filter((item) => item[key].includes(searchString))
      }
    })

    let total = result.length

    result = result.slice(skip, skip + limit)
    result.forEach((file) => {
      file.url = storageProvider.getCachedURL(file.key, params && params.provider == null)
    })

    if (params.provider && !isAdmin) {
      const knexClient: Knex = this.app.get('knexClient')
      const projectPermissions: { 'project-permission': ProjectPermissionType; project: ProjectType }[] =
        await knexClient
          .from(projectPermissionPath)
          .join(projectPath, `${projectPermissionPath}.projectId`, `${projectPath}.id`)
          .where(`${projectPermissionPath}.userId`, params.user!.id)
          .select()
          .options({ nestTables: true })

      if (directory === 'projects/') {
        total = projectPermissions.length
      }

      const allowedProjectNames = projectPermissions.map((permission) => permission.project.name)
      result = result.filter((item) => {
        return (
          allowedProjectNames.some((project) => item.key.startsWith(`projects/${project}`)) || item.name === 'projects'
        )
      })
    }

    return {
      total,
      limit,
      skip,
      data: result
    }
  }

  /**
   * Create a directory
   */
  async create(directory: string, params?: FileBrowserParams) {
    const storageProvider = getStorageProvider(params?.query?.storageProviderName)
    if (directory[0] === '/') directory = directory.slice(1)

    ensureProjectsDirectory(directory)

    const parentPath = path.dirname(directory)
    const key = await getIncrementalName(path.basename(directory), parentPath, storageProvider, true)
    const keyPath = path.join(parentPath, key)

    const result = await storageProvider.putObject({ Key: keyPath } as StorageObjectInterface, {
      isDirectory: true
    })

    if (config.server.edgeCachingEnabled)
      await this.app.service(invalidationPath).create({
        path: keyPath
      })

    if (config.fsProjectSyncEnabled) fs.mkdirSync(path.resolve(projectsRootFolder, keyPath), { recursive: true })

    return result
  }

  /**
   * Move content from one path to another
   */
  async update(id: NullableId, data: FileBrowserUpdate, params?: FileBrowserParams) {
    const storageProviderName = data.storageProviderName
    delete data.storageProviderName
    const storageProvider = getStorageProvider(storageProviderName)

    /** @todo future proofing for when projects include orgname */
    if (!data.oldPath.startsWith('projects/' + data.oldProject)) throw new Error('Not allowed to access this directory')
    if (!data.newPath.startsWith('projects/' + data.newProject)) throw new Error('Not allowed to access this directory')

    const _oldPath = data.oldPath.split('/').slice(1).join('/')
    const _newPath = data.newPath.split('/').slice(1).join('/')
    const oldName = data.oldPath.split('/').pop()!
    const newName = data.newPath.split('/').pop()!

    const isDirectory = await storageProvider.isDirectory(oldName, _oldPath)
    const fileName = await getIncrementalName(newName, _newPath, storageProvider, isDirectory)
    await storageProvider.moveObject(oldName, fileName, _oldPath, _newPath, data.isCopy)

    if (config.server.edgeCachingEnabled)
      await this.app.service(invalidationPath).create([
        {
          path: _oldPath + oldName
        },
        {
          path: _newPath + fileName
        }
      ])

    const staticResources = (await this.app.service(staticResourcePath).find({
      query: {
        key: { $like: `%${path.join(_oldPath, oldName)}%` }
      },
      paginate: false
    })) as StaticResourceType[]

    if (!staticResources?.length) throw new Error('Static resource not found')

    const results = [] as StaticResourceType[]
    for (const resource of staticResources) {
      const newKey = resource.key.replace(path.join(_oldPath, oldName), path.join(_newPath, fileName))
      const result = await this.app.service(staticResourcePath).patch(
        resource.id,
        {
          key: newKey
        },
        { isInternal: true }
      )
      results.push(result)
    }

    const oldNamePath = path.join(projectsRootFolder, _oldPath, oldName)
    const newNamePath = path.join(projectsRootFolder, _newPath, fileName)

    if (config.fsProjectSyncEnabled) {
      // ensure the directory exists
      if (!fs.existsSync(path.dirname(newNamePath))) {
        const dirname = path.dirname(newNamePath)
        fs.mkdirSync(dirname, { recursive: true })
      }
      // move or copy the file
      if (data.isCopy) fs.copyFileSync(oldNamePath, newNamePath)
      else fs.renameSync(oldNamePath, newNamePath)
    }

    return results
  }

  /**
   * Upload file
   */
  async patch(id: NullableId, data: FileBrowserPatch, params?: FileBrowserParams) {
    if (!data.path.startsWith('assets/') && !data.path.startsWith('public/'))
      throw new Error('Not allowed to access this directory ' + data.path)

    if (typeof data.body === 'string') {
      const url = new URL(data.body)
      try {
        const response = await fetch(url)
        const arr = await response.arrayBuffer()
        data.body = Buffer.from(arr)
      } catch (error) {
        throw new Error('Invalid URL ' + url)
      }
    }
    const key = path.join('projects', data.project, data.path)

    /** @todo should we allow user-specific content types? Or standardize on the backend? */
    const contentType = data.contentType ?? getContentType(key)

    const existingResourceQuery = (await this.app.service(staticResourcePath).find({
      query: { key }
    })) as Paginated<StaticResourceType>
    const existingResource = existingResourceQuery.data.length ? existingResourceQuery.data[0] : undefined
    console.log(existingResource)

    const staticResource = await uploadStaticResource(this.app, {
      ...data,
      key,
      contentType,
      id: existingResource?.id
    })

    if (config.fsProjectSyncEnabled) {
      const filePath = path.resolve(projectsRootFolder, key)
      const dirname = path.dirname(filePath)
      fs.mkdirSync(dirname, { recursive: true })
      fs.writeFileSync(filePath, data.body)
    }

    return staticResource
  }

  /**
   * Remove a directory
   */
  async remove(key: string, params?: FileBrowserParams) {
    const storageProviderName = params?.query?.storageProviderName
    if (storageProviderName) delete params.query?.storageProviderName

    ensureProjectsDirectory(key)

    const storageProvider = getStorageProvider(storageProviderName)
    const dirs = await storageProvider.listObjects(key, true)
    const result = await storageProvider.deleteResources([key, ...dirs.Contents.map((a) => a.Key)])

    if (config.server.edgeCachingEnabled)
      await this.app.service(invalidationPath).create({
        path: key
      })

    const staticResources = (await this.app.service(staticResourcePath).find({
      query: {
        key: { $like: `%${key}%` }
      },
      paginate: false
    })) as StaticResourceType[]

    if (staticResources?.length > 0) {
      await Promise.all(
        staticResources.map(async (resource) => await this.app.service(staticResourcePath).remove(resource.id))
      )
    }

    if (config.fsProjectSyncEnabled) fs.rmSync(path.resolve(projectsRootFolder, key), { recursive: true })

    return result
  }
}
