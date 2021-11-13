import {Weaving as CoreWeaving} from 'parser/core/modules/Weaving'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

export class Weaving extends CoreWeaving {
	static override displayOrder = DISPLAY_ORDER.WEAVING_ISSUES
}
