import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Message, Table, Button, Header, Icon} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Downtime from 'parser/core/modules/Downtime'
import {getDataBy} from 'data'
import Module, {dependency} from 'parser/core/Module'
import React, {Fragment} from 'react'
import {Timeline} from 'parser/core/modules/Timeline'

// Buffer (ms) to forgive insignificant drift, we really only care about GCD drift here
// and not log inconsistencies / sks issues / misguided weaving
const DRIFT_BUFFER = 1200

const DRIFT_ABILITIES = [
	ACTIONS.HIGH_JUMP.id,
	ACTIONS.GEIRSKOGUL.id,
]

const COOLDOWN_MS = {
	[ACTIONS.HIGH_JUMP.id]: ACTIONS.HIGH_JUMP.cooldown * 1000,
	[ACTIONS.GEIRSKOGUL.id]: ACTIONS.GEIRSKOGUL.cooldown * 1000,
}

class DriftWindow {
	actionId: number
	start: number
	end: number = 0
	drift: number = 0
	abilityRotation: CastEvent[] = []

	constructor(actionId: number, start: number) {
		this.actionId = actionId
		this.start = start
	}

	public addAbility(event: CastEvent) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (action) {
			this.abilityRotation.push(event)
		}
	}

	public getLastActionId(): number {
		return this.abilityRotation.slice(-1)[0].ability.guid
	}
}

export default class Drift extends Module {
	static handle = 'drift'
	static title = t('drg.drift.title')`Ability Drift`

	@dependency private downtime!: Downtime
	@dependency private timeline!: Timeline

	private driftedWindows: DriftWindow[] = []

	private currentWindows = {
		[ACTIONS.HIGH_JUMP.id]: new DriftWindow(ACTIONS.HIGH_JUMP.id, this.parser.fight.start_time),
		[ACTIONS.GEIRSKOGUL.id]: new DriftWindow(ACTIONS.GEIRSKOGUL.id, this.parser.fight.start_time),
	}

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: DRIFT_ABILITIES}, this.onDriftableCast)
		this.addEventHook('cast', {by: 'player'}, this.onCast)
	}

	private onDriftableCast(event: CastEvent) {
		let actionId: number
		actionId = event.ability.guid

		const window = this.currentWindows[actionId]
		window.end = event.timestamp
		const downtime = this.downtime.getDowntime(window.start, window.end)
		const cd = COOLDOWN_MS[actionId]
		window.drift = Math.max(0, window.end - window.start - cd - downtime)

		// Forgive "drift" in reopener situations
		if (window.drift > DRIFT_BUFFER && downtime < cd) {
			this.driftedWindows.push(window)
			window.addAbility(event)
		}

		this.currentWindows[actionId] = new DriftWindow(actionId, event.timestamp)
	}

	private onCast(event: CastEvent) {
		for (const window of Object.values(this.currentWindows)) {
			window.addAbility(event)
		}
	}

	private createTimelineButton(timestamp: number) {
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp - this.parser.fight.start_time)}
			content={this.parser.formatTimestamp(timestamp)}
		/>
	}

	private createDriftTable(casts: DriftWindow[]) {
		let totalDrift = 0
		const action = getDataBy(ACTIONS, 'id', casts[0].actionId)
		return <Table>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><ActionLink {...action} /> Casts</Table.HeaderCell>
					<Table.HeaderCell>Drift</Table.HeaderCell>
					<Table.HeaderCell>Total Drift</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{casts.map((event) => {
					totalDrift += event.drift
					return <Table.Row key={event.start}>
						<Table.Cell>{this.createTimelineButton(event.start)}</Table.Cell>
						<Table.Cell>{event.drift !== null ? this.parser.formatDuration(event.drift) : '-'}</Table.Cell>
						<Table.Cell>{totalDrift ? this.parser.formatDuration(totalDrift) : '-'}</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
	}

	output() {
		// Nothing to show
		if (!this.driftedWindows.length) return

		return <Fragment>
			<Message>
				<Trans id="drg.drift.accordion.message">
					<ActionLink {...ACTIONS.HIGH_JUMP}/> and <ActionLink {...ACTIONS.GEIRSKOGUL}/> are two of the most critical damaging abilities on Dragoon, and should be kept on cooldown as much as possible in order to not lose life windows.
				</Trans>
			</Message>
			{this.createDriftTable(this.driftedWindows.filter((ability) => {
				return ability.actionId === ACTIONS.HIGH_JUMP.id
			}))}
			{this.createDriftTable(this.driftedWindows.filter((ability) => {
				return ability.actionId === ACTIONS.GEIRSKOGUL.id
			}))}
		</Fragment>
	}
}
