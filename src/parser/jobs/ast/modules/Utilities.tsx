import {Action} from "data/ACTIONS"
import {Utilities as CoreUtilities} from "parser/core/modules/UtilityActions"
import {DISPLAY_ORDER} from "./DISPLAY_ORDER"

export class Utilities extends CoreUtilities {
	static override displayOrder: number = DISPLAY_ORDER.UTILITIES

	protected override trackedActions: Action[] = [
		this.data.actions.LIGHTSPEED,
		this.data.actions.SWIFTCAST,
		this.data.actions.LUCID_DREAMING,
	]
}
