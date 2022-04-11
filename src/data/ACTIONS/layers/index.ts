import {Layer} from 'data/layer'
import {ActionRoot} from '../root'
import {patch610} from './patch6.1'

export const layers: Array<Layer<ActionRoot>> = [
	// Layers should be in their own files, and imported for use here.
	// Example layer:
	// {patch: '5.05', data: {ATTACK: {id: 9001}}},
	patch610,
]
