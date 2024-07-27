import {Tincture as CoreTincture} from 'parser/core/modules/Tincture'

export class Tincture extends CoreTincture {
	override initialise(): void {
		super.initialise()

		this.ignoreActions([this.data.actions.STAR_PRISM_CURE.id])
	}
}
