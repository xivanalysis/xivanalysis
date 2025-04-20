import {Action} from "data/ACTIONS"
import {Utilities as CoreUtilities} from "parser/core/modules/UtilityActions"
import {ReactNode} from "react"
import {DISPLAY_ORDER} from "./DISPLAY_ORDER"

export class Utilities extends CoreUtilities {
	static override displayOrder: number = DISPLAY_ORDER.UTILITIES

	// Triplecast and Swiftcast utility usage analysis only included for 7.2+
	protected override trackedActions: Action[] = this.parser.patch.before('7.2') ? [] : [
		this.data.actions.SWIFTCAST,
		this.data.actions.TRIPLECAST,
	]

	protected override headerContent: ReactNode = undefined
}
