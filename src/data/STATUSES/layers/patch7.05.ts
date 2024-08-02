import {iconUrl} from 'data/icon'
import {Layer} from 'data/layer'
import {StatusRoot} from '../root'
import {SHARED} from '../root/SHARED'

export const patch705: Layer<StatusRoot> = {
	patch: '7.05',
	data: {
		//Viper changes
		NOXIOUS_GNASH: {id: SHARED.UNKNOWN.id},
		HONED_STEEL: {
			id: 3672,
			name: 'Honed Steel',
			icon: iconUrl(13757),
			duration: 60000,
		},
		HONED_REAVERS: {
			id: 3772,
			name: 'Honed Reavers',
			icon: iconUrl(13758),
			duration: 60000,
		},
		HINDSBANE_VENOM: {duration: 60000},
		HINDSTUNG_VENOM: {duration: 60000},
		FLANKSBANE_VENOM: {duration: 60000},
		FLANKSTUNG_VENOM: {duration: 60000},
		GRIMSKINS_VENOM: {duration: 60000},
		GRIMHUNTERS_VENOM: {duration: 60000},

		MAGICKED_SWORDPLAY: {
			duration: 30000,
		},
	},
}
