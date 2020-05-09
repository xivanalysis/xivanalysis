import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Downtime from 'parser/core/modules/Downtime'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {max} from 'moment'
import {Action} from 'history'
import {timeHours} from 'd3-time'

// Escalate severity depending on how long drill/AA were drifted for (calculated in seconds)
const DRIFT_SEVERITY_TIERS = {
	5: SEVERITY.MINOR,
	10: SEVERITY.MEDIUM,
	20: SEVERITY.MAJOR,
}

// Buffer (ms) to forgive insignificant drift, we really only care about GCD drift here
// and not log inconsistencies / sks issues / misguided weaving
const DRIFT_BUFFER = 1500

const DRIFT_GCDS = [
	ACTIONS.DRILL.id,
	ACTIONS.AIR_ANCHOR.id,
]

const COOLDOWN_MS = {
	[ACTIONS.DRILL.id]: ACTIONS.DRILL.cooldown * 1000,
	[ACTIONS.AIR_ANCHOR.id]: ACTIONS.AIR_ANCHOR.cooldown * 1000,
}

class DriftWindow {
	actionId: number
	start: number
	end: number = 0
	drift: number = 0
	gcdRotation: CastEvent[] = []

	constructor(actionId: number, start: number) {
		this.actionId = actionId
		this.start = start
	}

	public addGcd(event: CastEvent) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (action && action.onGcd) {
			this.gcdRotation.push(event)
		}
	}
}

export default class Drift extends Module {
	static handle = 'drift'
	static title = t('mch.drift.title')`GCD Drift`

	@dependency private suggestions!: Suggestions
	@dependency private downtime!: Downtime

	private driftedWindows: DriftWindow[] = []

	private currentWindows = {
		[ACTIONS.DRILL.id]: new DriftWindow(ACTIONS.DRILL.id, this.parser.fight.start_time),
		[ACTIONS.AIR_ANCHOR.id]: new DriftWindow(ACTIONS.AIR_ANCHOR.id, this.parser.fight.start_time),
	}

	private totalDrift = {
		[ACTIONS.DRILL.id]: 0,
		[ACTIONS.AIR_ANCHOR.id]: 0,
	}

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: DRIFT_GCDS}, this.onDriftableCast)
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onDriftableCast(event: CastEvent) {
		const actionId = event.ability.guid
		const window = this.currentWindows[actionId]
		window.end = event.timestamp
		const downtime = this.downtime.getDowntime(window.start, window.end)
		const cd = COOLDOWN_MS[actionId]
		window.drift = Math.max(0, window.end - window.start - cd - downtime)

		// Forgive "drift" in reopener situations
		if (window.drift > DRIFT_BUFFER && downtime < cd) {
			this.driftedWindows.push(window)
			this.totalDrift[actionId] += window.drift
			window.addGcd(event)
		}

		this.currentWindows[actionId] = new DriftWindow(actionId, event.timestamp)
	}

	private onCast(event: CastEvent) {
		for (const [, window] of Object.entries(this.currentWindows)) {
			window.addGcd(event)
		}
	}

	private onComplete() {
		const drillDriftSeconds = Math.round(this.totalDrift[ACTIONS.DRILL.id] / 1000)
		const possibleLostDrills = Math.ceil(this.totalDrift[ACTIONS.DRILL.id] / COOLDOWN_MS[ACTIONS.DRILL.id])
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DRILL.icon,
			content: <Trans id="mch.drift.suggestions.drill-drift.content">
				<Plural value={possibleLostDrills} one="You may have lost a cast" other="You lost multiple potential casts"/> of <ActionLink {...ACTIONS.DRILL} /> by letting the cooldown drift. Try to always use it as soon as it's off cooldown.
			</Trans>,
			tiers: DRIFT_SEVERITY_TIERS,
			value: drillDriftSeconds,
			why: <Trans id="mch.drift.suggestions.drill-drift.why">
				Drill was drifted for {drillDriftSeconds} seconds in total.
			</Trans>,
		}))

		const anchorDriftSeconds = Math.round(this.totalDrift[ACTIONS.AIR_ANCHOR.id] / 1000)
		const possibleLostAnchors = Math.ceil(this.totalDrift[ACTIONS.AIR_ANCHOR.id] / COOLDOWN_MS[ACTIONS.AIR_ANCHOR.id])
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.AIR_ANCHOR.icon,
			content: <Trans id="mch.drift.suggestions.anchor-drift.content">
				<Plural value={possibleLostAnchors} one="You may have lost a cast" other="You lost multiple potential casts"/> of <ActionLink {...ACTIONS.AIR_ANCHOR} /> by letting the cooldown drift. Try to always use it as soon as it's off cooldown.
			</Trans>,
			tiers: DRIFT_SEVERITY_TIERS,
			value: anchorDriftSeconds,
			why: <Trans id="mch.drift.suggestions.anchor-drift.why">
				Air Anchor was drifted for {anchorDriftSeconds} seconds in total.
			</Trans>,
		}))
	}

	output() {
		// Nothing to show
		if (!this.driftedWindows) return

		const panels = this.driftedWindows.map(window => {
			return {
				title: {
					key: 'title-' + window.start,
					content: <Fragment>
						{this.parser.formatTimestamp(window.end)}
						<span> - </span>
						<Trans id="mch.drift.panel-drift">
							<ActionLink {...getDataBy(ACTIONS, 'id', window.actionId)}/> drifted by {this.parser.formatDuration(window.drift)}
						</Trans>
					</Fragment>,
				},
				content: {
					key: 'content-' + window.start,
					content: <Rotation events={window.gcdRotation}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="mch.drift.accordion.message">
					<ActionLink {...ACTIONS.DRILL}/> and <ActionLink {...ACTIONS.AIR_ANCHOR}/> are your strongest GCDs and ideally they should always be kept on cooldown,
					unless you need to insert a filler GCD to adjust for skill speed. Avoid casting <ActionLink {...ACTIONS.HYPERCHARGE}/>
					if Drill or Air Anchor will come off cooldown within 8-10 seconds.
				</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</Fragment>
	}
}
