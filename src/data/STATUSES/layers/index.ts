import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {patch701} from './patch7.01'
import {patch705} from './patch7.05'

export const layers: Array<Layer<StatusRoot>> = [
	// Layers should be in their own files, and imported for use here.
	// Example layer:
	// {patch: '5.05', data: {BIO_II: {id: 9001}}}}
	patch701,
	patch705,
]
