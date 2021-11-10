import {Weaving as CoreWeaving} from 'parser/core/modules/Weaving'
import {DisplayOrder} from './DisplayOrder'

export class Weaving extends CoreWeaving {
	static override displayOrder = DisplayOrder.WeavingIssues
}
