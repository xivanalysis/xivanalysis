import {NotCasting as CoreNotCasting} from 'parser/core/modules/NotCasting'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class NotCasting extends CoreNotCasting {
	static override displayOrder = DISPLAY_ORDER.NOTCASTING
	protected override includeOGCDs: boolean = true
}
