import { NativeTypes } from 'react-dnd-html5-backend'

/**
 * ItemTypes object containing types of items used.
 *
 * @author Robert Long
 * @author Abhishek Pathak
 * @type {Object}
 */
export const ItemTypes = {
  File: NativeTypes.FILE,
  FileBrowserContent: ['png', NativeTypes.FILE, 'folder'],
  Node: 'Node',
  Model: 'Model',
  Image: 'Image',
  Video: 'Video',
  Audio: 'Audio',
  Volumetric: 'Volumetric',
  Element: 'Element'
}

/**
 * AssetTypes array containing types of items used.
 *
 * @author Robert Long
 * @type {Array}
 */
export const AssetTypes = [
  ItemTypes.Model,
  ItemTypes.Image,
  ItemTypes.Video,
  ItemTypes.Audio,
  ItemTypes.Volumetric,
  ItemTypes.Element
]

/**
 * isAsset function to check item exists in array types or not.
 *
 * @author Robert Long
 * @param {object} item
 */
export function isAsset(item) {
  return AssetTypes.indexOf(item.type) !== -1
}
