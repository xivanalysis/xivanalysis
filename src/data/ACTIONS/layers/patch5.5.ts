import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch550: Layer<ActionRoot> = {
	patch: '5.5',
	data: {
		// WAR 5.5 potency changes
		MAIM: {combo: {
			from: 31,
			potency: 320,
		}},
		STORMS_EYE: {combo: {
			from: 37,
			potency: 420,
			end: true,
		}},
		STORMS_PATH: {combo: {
			from: 37,
			potency: 420,
			end: true,
		}},
	},
}
