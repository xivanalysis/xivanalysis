import {Trans} from '@lingui/react'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import styles from 'components/ui/Rotation.module.css'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {getIsAprilFirst} from 'parser/core'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

interface GCD {
	timestamp: number
	action: Action
	dfTimer?: number
	reason?: string
}

const REFRESH_TWIN_WINDOW: number = 3000

export class DKOptimalGoof extends Analyser {
	static override handle = 'DragonKickRotation'

	@dependency private checklist!: Checklist

	@dependency private data!: Data
	@dependency private timeline!: Timeline
	@dependency private actors!: Actors

	private readonly blitz = [
		this.data.actions.CELESTIAL_REVOLUTION.id,
		this.data.actions.ELIXIR_FIELD.id,
		this.data.actions.RISING_PHOENIX.id,
		this.data.actions.PHANTOM_RUSH.id,
	]

	private dragonKicks: GCD[] = []
	private missedKicks: GCD[] = []
	private twinRefreshExpected?: number

	override initialise(): void {
		if (getIsAprilFirst()) {
			const playerFilter = filter<Event>().source(this.parser.actor.id)

			this.addEventHook(playerFilter.type('action'), this.onCast)
			this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.DISCIPLINED_FIST.id), this.onGain)
			this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.DISCIPLINED_FIST.id), this.onDrop)

			this.addEventHook('complete', this.onComplete)
		}
	}

	private onCast(event: Events['action']) {
		const action = this.data.getAction(event.action)

		const inPB = this.actors.current.hasStatus(this.data.statuses.PERFECT_BALANCE.id)
		if (action == null || !(action.onGcd ?? false) || inPB  || this.blitz.includes(action.id)) { return }

		const gcd: GCD = {
			timestamp: event.timestamp,
			action: action,
		}

		const isDragonKick = action.id === this.data.actions.DRAGON_KICK.id
		const inDisciplinedFist = this.actors.current.hasStatus(this.data.statuses.DISCIPLINED_FIST.id)
		let needTwinRefresh = true
		if (this.twinRefreshExpected) {
			needTwinRefresh = this.twinRefreshExpected - event.timestamp < REFRESH_TWIN_WINDOW
			gcd.dfTimer = this.twinRefreshExpected  - event.timestamp
		}

		if (this.actors.current.hasStatus(this.data.statuses.LEADEN_FIST.id) && (
			this.actors.current.hasStatus(this.data.statuses.OPO_OPO_FORM.id)
				|| this.actors.current.hasStatus(this.data.statuses.FORMLESS_FIST.id))) {
			return
		}

		if (!inDisciplinedFist || this.actors.current.hasStatus(this.data.statuses.COEURL_FORM.id)) { return }

		if (!needTwinRefresh) {
			if (isDragonKick) {
				this.dragonKicks.push(gcd)
			} else {
				gcd.reason = 'Not a dragon kick :('
				this.missedKicks.push(gcd)
			}
		}
	}

	onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="mnk.dragonkickrotation.checklist.name">Dragon Kick to win</Trans>,
			description: <Trans id="mnk.dragonkickrotation.checklist.description">
				<DataLink action="DRAGON_KICK"/> is your strongest GCD, if you want to win, press it.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DK_OPTIMAL_GOOF,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.dragonkickrotation.checklist.requirement.name">Optimal <DataLink action="DRAGON_KICK"/>s  </Trans>,
					value: this.dragonKicks.length,
					target: this.dragonKicks.length + this.missedKicks.length,
				}),
			],
			target: 95,
		}))
	}

	private onGain(event: Events['statusApply']): void {
		const status = this.data.getStatus(event.status)
		//sanity check
		if (status && status.id === this.data.statuses.DISCIPLINED_FIST.id && status.duration) {
			this.twinRefreshExpected = event.timestamp + status.duration
		}

	}

	private onDrop(): void {
		this.twinRefreshExpected = undefined
	}

	override output(): React.ReactNode {
		if (this.missedKicks.length <= 0) {
			return false
		}

		const data = this.missedKicks.sort((a, b) => a.timestamp - b.timestamp)

		return <Table compact unstackable celled textAlign="center">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.dkmiss-table.header.time">Time</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.dkmiss-table.header.dftimer"><DataLink action="TWIN_SNAKES" showName={false} /></Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="core.ui.dkmiss-table.header.action">Action</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.dkmiss-table.header.reason">Reason</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					data.map((issue, index) => {

						const action = issue.action

						return <Table.Row key={issue.timestamp}>
							<Table.Cell style={{whiteSpace: 'nowrap'}}>
								{issue.timestamp > 0 &&
									<>
										<span>{this.parser.formatEpochTimestamp(issue.timestamp, 0)}</span>
										<Button style={{marginLeft: 5}}
											circular
											compact
											size="mini"
											icon="time"
											onClick={() => this.timeline.show(this.relativeTimestamp(issue.timestamp), this.relativeTimestamp(issue.timestamp))}
										/>
									</>}
							</Table.Cell>
							<Table.Cell>
								{ issue.dfTimer &&
									<>
										<span>{this.parser.formatDuration(issue.dfTimer, 2)}</span>
									</>
								}
							</Table.Cell>
							<Table.Cell>
								<div
									key={index}
								>
									<ActionLink
										showName={false}
										iconSize={styles.gcdSize}
										{...action}
									/>
								</div>
							</Table.Cell>
							<Table.Cell>
								<span style={{whiteSpace: 'nowrap'}}>{issue.reason}</span>
							</Table.Cell>
						</Table.Row>
					})
				}
			</Table.Body>
		</Table>
	}
	private relativeTimestamp(timestamp: number) {
		return timestamp - this.parser.pull.timestamp
	}
}

