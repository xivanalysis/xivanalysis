import {Action} from "data/ACTIONS"
import {Utilities as CoreUtilities} from "parser/core/modules/UtilityActions"

export class Utilities extends CoreUtilities {
	protected override trackedActions: Action[] = [
		this.data.actions.SWIFTCAST,
		this.data.actions.LUCID_DREAMING,
	]
}
