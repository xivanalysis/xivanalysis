import {Layer} from 'data/layer'
import {ActionRoot} from '../root'
import {patch501} from './patch5.01'
import {patch510} from './patch5.1'
import {patch530} from './patch5.3'
import {patch540} from './patch5.4'

export const layers: Array<Layer<ActionRoot>> = [
	// Layers should be in their own files, and imported for use here.
	// Example layer:
	// {patch: '5.05', data: {ATTACK: {id: 9001}}},

	patch501,
	patch510,
	patch530,
	patch540,
]
