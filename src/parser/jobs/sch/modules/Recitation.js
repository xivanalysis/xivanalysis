import React from 'react'
import {Trans, Plural} from '@lingui/react'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module, {dependency} from 'parser/core/Module'
import {PieChartStatistic} from 'parser/core/modules/Statistics'
import {ActionLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

/*
* Thanks to the following for feedback on content (via the #sch_lounge) balance channel:
* AbsoluteCat#3484
* DialaceStarvy#0185
* Alevia#1270
* "toxic tank main"
* Sassy#0909
* [Déjà Vult]#4097
* Saeyr#0081
*/

// used to filter cast events to only what we're looking for
const RECITATION_CONSUMERS = [
	ACTIONS.ADLOQUIUM.id,
	ACTIONS.INDOMITABILITY.id,
	ACTIONS.SUCCOR.id,
	ACTIONS.EXCOGITATION.id,
]

// maps recitation consumers to a color for the pie chart
const COLORMAP = {
	[ACTIONS.ADLOQUIUM.id]: '#92ac4a',
	[ACTIONS.INDOMITABILITY.id]: '#89cd87',
	[ACTIONS.SUCCOR.id]: '#6cc551',
	[ACTIONS.EXCOGITATION.id]: '#55773c',
}

// the order the pie chart's rows appears in
const PIECHART_ORDER = [
	ACTIONS.ADLOQUIUM.id,
	ACTIONS.EXCOGITATION.id,
	ACTIONS.INDOMITABILITY.id,
	ACTIONS.SUCCOR.id,
]

// judge them harshly.
const MISSED_RECITATION_SEVERITIES = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

export default class Recitation extends Module {
	static handle = 'recitation'
	static debug = false

	@dependency statistics
	@dependency suggestions

	_recitationActive = false
	_recitationUsed = false
	_recitationUses

	constructor(...args) {
		super(...args)

		this._recitationUses = new Map()

		this.addEventHook('cast', {by: 'player', abilityId: RECITATION_CONSUMERS}, this._onCast)
		this.addEventHook('applybuff', {by: 'player', abilityId: STATUSES.RECITATION.id}, () => this._recitationActive = true)
		this.addEventHook('removebuff', {by: 'player', abilityId: STATUSES.RECITATION.id}, this._judgeRecitation)

		this.addEventHook('complete', this._onComplete)
	}

	// we're just checking if recitation is active before adding the cast to the list
	_onCast(event) {
		this.debug(`Evaluating cast ${event.ability.name} (Recitation active: ${this._recitationActive})`)
		if (this._recitationActive) {
			const guid = event.ability.guid
			const uses = this._recitationUses.get(guid) || 0
			this._recitationUses.set(guid, uses + 1)
			this._recitationUsed = true
		}
	}

	// you will be judged - like sheep before the wolf
	// – Argath Thadalfus
	_judgeRecitation() {
		this.debug(`Recitation removed (used: ${this._recitationUsed})`)
		if (! this._recitationUsed) {
			// uh-oh, they let it drop
			this.debug(`Detecting a missed recitation at ${this.parser.currentTimestamp}`)
			const misses = this._recitationUses.get('missed') || 0
			this._recitationUses.set('missed', misses + 1)
		}
		// reset everything so we're reaady for next time
		this._recitationActive = false
		this._recitationUsed = false
	}

	_onComplete() {
		// generate pie chart data
		const data = []
		PIECHART_ORDER.forEach(actionId => {
			const count = this._recitationUses.get(actionId) || 0
			if (count > 0) {
				const action = getDataBy(ACTIONS, 'id', actionId)
				data.push({
					value: count,
					color: COLORMAP[actionId],
					columns: [
						<><ActionLink {...action}/></>,
						count,
					],
				})
			}
		})

		const missedCount = this._recitationUses.get('missed') || 0
		if (missedCount > 0) {
			// punish them for missing recitation
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.RECITATION.icon,
				tiers: MISSED_RECITATION_SEVERITIES,
				value: missedCount,
				content: <Trans id="sch.recitation.suggestion.content">Use a corresponding healing skill within Recitation's duration. Not using a corresponding action wastes the CD and a weave slot.</Trans>,
				why: <Trans id="sch.recitation.suggestion.why">{missedCount} <Plural value={missedCount} one="use" other="uses"/> of Recitation had no corresponding action cast to trigger its effect.</Trans>,
			}))
		}

		this.statistics.add(new PieChartStatistic({
			headings: [
				'Recitation use',
				'#',
			],
			data,
			width: 2,
		}))
	}
}
