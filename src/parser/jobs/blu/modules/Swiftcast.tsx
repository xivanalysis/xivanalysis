import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// Annoyingly we can't directly use the Swiftcast
export class Swiftcast extends CoreSwiftcast {
	static override displayOrder = DISPLAY_ORDER.SWIFTCAST
}

