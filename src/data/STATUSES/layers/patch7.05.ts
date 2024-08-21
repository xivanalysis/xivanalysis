import {iconUrl} from 'data/icon'
import {Layer} from 'data/layer'
import {StatusRoot} from '../root'

export const patch705: Layer<StatusRoot> = {
	patch: '7.05',
	data: {
		MAGICKED_SWORDPLAY: {
			duration: 30000,
		},
		TENGETSU_FORESIGHT: {duration: 9000},

		TSUBAME_GAESHI_MIDARE: {
			id: 4216,
			name: 'Tsubame-Gaeshi',
			icon: iconUrl(13315),
			duration: 30000,
		},

		TSUBAME_GAESHI_TENDO_GOKEN: {
			id: 4217,
			name: 'Tsubame-Gaeshi',
			icon: iconUrl(13315),
			duration: 30000,
		},

		TSUBAME_GAESHI_TENDO_MIDARE: {
			id: 4218,
			name: 'Tsubame-Gaeshi',
			icon: iconUrl(13315),
			duration: 30000,
		},
	},
}
