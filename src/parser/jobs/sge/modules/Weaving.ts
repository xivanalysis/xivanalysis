import {Weaving as CoreWeaving} from 'parser/core/modules/Weaving'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export default class Weaving extends CoreWeaving {
	static override displayOrder = DISPLAY_ORDER.WEAVING

	// Pneuma's cure isn't a real action, it can't hurt you
	override ignoredActionIds = [this.data.actions.PNEUMA_HEAL.id]
}
