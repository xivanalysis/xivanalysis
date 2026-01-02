import {Weaving as CoreWeaving} from 'parser/core/modules/AlwaysBeCasting/Weaving'

export class Weaving extends CoreWeaving {
	// Pneuma's cure isn't a real action, it can't hurt you
	override ignoredActionIds = [this.data.actions.PNEUMA_HEAL.id]
}
