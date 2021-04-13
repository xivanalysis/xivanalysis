import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {patch505} from './patch5.05'
import {patch510} from './patch5.1'
import {patch530} from './patch5.3'
import {patch540} from './patch5.4'
import {patch550} from './patch5.5'

export const layers: Array<Layer<StatusRoot>> = [
	// Layers should be in their own files, and imported for use here.
	// Example layer:
	// {patch: '5.05', data: {BIO_II: {id: 9001}}}}
	patch505,
	patch510,
	patch530,
	patch540,
	patch550,
]
