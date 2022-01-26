import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {Weaving as CoreWeaving} from 'parser/core/modules/Weaving'
import React from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const WEAVING_SEVERITY = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

export default class Weaving extends CoreWeaving {
	static override displayOrder = DISPLAY_ORDER.WEAVING

	override suggestionContent = <Trans id="sch.weaving.content">
		Try to use <DataLink action="BROIL_IV" />, <DataLink action="SCH_RUIN_II" />, or <DataLink action="BIOLYSIS" /> to weave your actions, and avoid weaving more actions than you have time for in a single GCD window.
		Doing so will delay your next GCD, reducing possible uptime. Check the {this.moduleLink} module below for more detailed analysis.
	</Trans>
	override severity = WEAVING_SEVERITY
}
