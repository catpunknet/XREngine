import { Hook, HookContext } from '@feathersjs/feathers'
import _ from 'lodash'

import config from '../appconfig'
import { getStorageProvider } from '../media/storageprovider/storageprovider'
import uploadThumbnailLinkHook from './upload-thumbnail-link'

export default (): Hook => {
  return async (context: HookContext): Promise<HookContext> => {
    const { app, data, params } = context
    if (data.id) {
      const currentResource = await app.service('static-resource').get(data.id)
      currentResource.metadata = JSON.parse(currentResource.metadata)

      if (
        currentResource.metadata.thumbnailUrl !== data.metadata.thumbnailUrl &&
        data.metadata.thumbnailUrl != null &&
        data.metadata.thumbnailUrl.length > 0
      ) {
        const existingThumbnails = await app.service('static-resource').find({
          query: {
            userId: params['identity-provider'].userId,
            parentResourceId: data.id,
            url: currentResource.metadata.thumbnailUrl || ''
          }
        })

        await Promise.all(
          existingThumbnails.data.map(async (item) => {
            return app.service('static-resource').remove(item.id)
          })
        )
        params.parentResourceId = data.id
        const bucketName = config.aws.s3.staticResourceBucket
        params.uploadPath = data.url.replace('https://s3.amazonaws.com/' + bucketName + '/', '')
        params.uploadPath = params.uploadPath.replace('/manifest.mpd', '')
        params.storageProvider = getStorageProvider()
        const contextClone = _.cloneDeep(context)
        const result = await (uploadThumbnailLinkHook() as any)(contextClone)
        data.metadata.thumbnailUrl = result.params.thumbnailUrl.replace(
          's3.amazonaws.com/' + bucketName,
          config.aws.cloudfront.domain
        )
      }
    }

    return context
  }
}
