import {Trans, Plural} from '@lingui/react'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CoreWeaving from 'parser/core/modules/Weaving'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const WEAVING_SEVERITY = {
	1: SEVERITY.MINOR,
	5: SEVERITY.MEDIUM,
	10: SEVERITY.MAJOR,
}

export default class Weaving extends CoreWeaving {
	static displayOrder = DISPLAY_ORDER.WEAVING

	// override to give SCH-relevant weave suggestions
	// Pretty much copy-pasted from the CoreWeaving Module otherwise
	_onComplete() {
		// If there's been at least one gcd, run a cleanup on any remnant data
		if (this._leadingGcdEvent) {
			this._saveIfBad()
		}

		// Few triples is medium, any more is major
		const badWeavesCount = this._badWeaves.length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SCH_RUIN_II.icon,
			content: <Trans id="sch.weaving.content">
				Try to use <ActionLink {...ACTIONS.SCH_RUIN_II}/> and <ActionLink {...ACTIONS.BIOLYSIS}/> to weave your actions, and avoid weaving more actions than you have time for in a single GCD window.
				Doing so will delay your next GCD, reducing possible uptime. Check the <a href="javascript:void(0);" onClick={() => this.parser.scrollTo(this.constructor.handle)}><NormalisedMessage message={this.constructor.title}/></a> module below for more detailed analysis.
			</Trans>,
			why: <Plural
				id="sch.weaving.why"
				value={badWeavesCount}
				one="# instance of incorrect weaving"
				other="# instances of incorrect weaving"
			/>,
			tiers: WEAVING_SEVERITY,
			value: badWeavesCount,
		}))
	}
}
