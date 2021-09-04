import {dependency} from 'parser/core/Module'
import {AlwaysBeCasting as CoreAlwaysBeCasting} from 'parser/core/modules/AlwaysBeCasting'
import {DualCast} from './Dualcast'

export class AlwaysBeCasting extends CoreAlwaysBeCasting {
	@dependency protected dualcast!: DualCast // Take a dependency on DualCast so that cast time adjustments for dual cast are avialable when calculating ABC time
}
