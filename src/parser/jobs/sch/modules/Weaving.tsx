import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Weaving as CoreWeaving} from 'parser/core/modules/AlwaysBeCasting/Weaving'
import {SEVERITY} from 'parser/core/modules/Suggestions'

const WEAVING_SEVERITY = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

export class Weaving extends CoreWeaving {

	override suggestionContent = <Trans id="sch.weaving.content">
		Try to use <DataLink action="BROIL_IV" />, <DataLink action="SCH_RUIN_II" />, or <DataLink action="BIOLYSIS" /> to weave your actions, and avoid weaving more actions than you have time for in a single GCD window.
		Doing so will delay your next GCD, reducing possible uptime. Check the {this.moduleLink} module below for more detailed analysis.
	</Trans>
	override severity = WEAVING_SEVERITY
}
