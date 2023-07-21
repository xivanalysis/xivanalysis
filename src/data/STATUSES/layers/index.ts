import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {patch610} from './patch6.1'
import {patch620} from './patch6.2'
import {patch630} from './patch6.3'

export const layers: Array<Layer<StatusRoot>> = [
	// Layers should be in their own files, and imported for use here.
	// Example layer:
	// {patch: '5.05', data: {BIO_II: {id: 9001}}}}
	patch610,
	patch620,
	patch630,
]
