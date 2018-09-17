/**
 * @author Yumiya
 */
import CooldownDowntime from '../../core/modules/CooldownDowntime'
import ACTIONS from 'data/ACTIONS'

export default class OGCDDowntime extends CooldownDowntime {

	constructor(...args) {
		super(...args)

		this.trackedCds = [
			ACTIONS.BARRAGE.id,
			ACTIONS.RAGING_STRIKES.id,
			ACTIONS.SIDEWINDER.id,
		]

		this.target = 100
	}

}
