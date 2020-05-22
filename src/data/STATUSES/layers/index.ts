import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

import {patch505} from './patch5.05'
import {patch510} from './patch5.1'

export const layers: Array<Layer<StatusRoot>> = [
	// Layers should be in their own files, and imported for use here.
	// Example layer:
	// {patch: '5.05', data: {BIO_II: {id: 9001}}}}
	patch505,
	patch510,
]
