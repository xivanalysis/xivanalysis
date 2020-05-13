import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Accordion, Message} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Downtime from 'parser/core/modules/Downtime'
import {getDataBy} from 'data'
import Module, {dependency} from 'parser/core/Module'
import React, {Fragment} from 'react'
import Rotation from 'components/ui/Rotation'


// Buffer (ms) to forgive insignificant drift, we really only care about GCD drift here
// and not log inconsistencies / sks issues / misguided weaving
const DRIFT_BUFFER = 1500

const DRIFT_GCDS = [
	ACTIONS.AIR_ANCHOR.id,
	ACTIONS.BIOBLASTER.id,
	ACTIONS.DRILL.id,
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

	public getLastActionId(): number {
		return this.gcdRotation.slice(-1)[0].ability.guid
	}
}

export default class Drift extends Module {
	static handle = 'drift'
	static title = t('mch.drift.title')`GCD Drift`

	@dependency private downtime!: Downtime

	private driftedWindows: DriftWindow[] = []

	private currentWindows = {
		[ACTIONS.AIR_ANCHOR.id]: new DriftWindow(ACTIONS.AIR_ANCHOR.id, this.parser.fight.start_time),
		[ACTIONS.DRILL.id]: new DriftWindow(ACTIONS.DRILL.id, this.parser.fight.start_time),
	}

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: DRIFT_GCDS}, this.onDriftableCast)
		this.addEventHook('cast', {by: 'player'}, this.onCast)
	}

	private onDriftableCast(event: CastEvent) {
		let actionId: number
		if (event.ability.guid === ACTIONS.BIOBLASTER.id) {
			actionId = ACTIONS.DRILL.id
		} else {
			actionId = event.ability.guid
		}

		const window = this.currentWindows[actionId]
		window.end = event.timestamp
		const downtime = this.downtime.getDowntime(window.start, window.end)
		const cd = COOLDOWN_MS[actionId]
		window.drift = Math.max(0, window.end - window.start - cd - downtime)

		// Forgive "drift" in reopener situations
		if (window.drift > DRIFT_BUFFER && downtime < cd) {
			this.driftedWindows.push(window)
			window.addGcd(event)
		}

		this.currentWindows[actionId] = new DriftWindow(actionId, event.timestamp)
	}

	private onCast(event: CastEvent) {
		for (const window of Object.values(this.currentWindows)) {
			window.addGcd(event)
		}
	}

	output() {
		// Nothing to show
		if (!this.driftedWindows.length) return

		const panels = this.driftedWindows.map(window => {
			return {
				title: {
					key: 'title-' + window.start,
					content: <Fragment>
						{this.parser.formatTimestamp(window.end)}
						<span> - </span>
						<Trans id="mch.drift.panel-drift">
							<ActionLink {...getDataBy(ACTIONS, 'id', window.getLastActionId())}/> drifted by {this.parser.formatDuration(window.drift)}
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
					unless you need to insert a filler GCD to adjust for skill speed. Avoid casting <ActionLink {...ACTIONS.HYPERCHARGE}/> if
					Drill or Air Anchor will come off cooldown within 8 seconds.
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
