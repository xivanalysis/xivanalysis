export {root} from './root'
export {layers} from './layers'

// Everything below here is temp back compat
import {applyLayer} from 'data/layer'
import {layers} from './layers'
import {root} from './root'

// need to export a collated everything-applied as default for back compat
const collated = layers.reduce(applyLayer, root)

// in dev, maybe proxy the collated and print warnings so we can aim towards 0?

export default collated
