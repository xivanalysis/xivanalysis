import {Defensives as CoreDefensives} from 'parser/core/modules/Defensives'

export class Defensives extends CoreDefensives {
	protected override trackedActions = [
		this.data.actions.SHIELD_SAMBA,
		this.data.actions.IMPROVISATION,
		this.data.actions.CURING_WALTZ,
	]
}
