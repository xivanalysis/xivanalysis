import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export class Tincture extends CoreTincture {
	static override displayOrder = DISPLAY_ORDER.TINCTURES

	override initialise(): void {
		super.initialise()

		this.ignoreActions([this.data.actions.STAR_PRISM_CURE.id])
	}
}
