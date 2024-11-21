import {iconUrl} from 'data/icon'
import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch710: Layer<StatusRoot> = {
	patch: '7.1',
	data: {
		CRIMSON_STRIKE_READY: {
			id: 4403,
			name: 'Crimson Strike Ready',
			icon: iconUrl(212752),
			duration: 30000,
		},
	},
}
