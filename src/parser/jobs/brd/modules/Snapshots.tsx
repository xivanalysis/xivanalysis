import React from 'react'
import {Trans} from '@lingui/react'
import {t} from '@lingui/macro'
import {Table} from 'semantic-ui-react'
import Module, {dependency} from 'parser/core/Module'
import {CastEvent} from 'fflogs'
import STATUSES, {Status} from 'data/STATUSES'
import {SNAPSHOT_BLACKLIST} from 'parser/jobs/brd/modules/SnapshotBlacklist'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Combatants from 'parser/core/modules/Combatants'
import {AbilityEvent} from 'fflogs'
import Util from './Util'
import {Data} from 'parser/core/modules/Data'

const SNAPSHOTTERS = [
	ACTIONS.IRON_JAWS.id,
	ACTIONS.CAUSTIC_BITE.id,
	ACTIONS.STORMBITE.id,
]

const DOT_STATUSES = [
	STATUSES.CAUSTIC_BITE.id,
	STATUSES.STORMBITE.id,
]

const PERSONAL_STATUSES = [
	STATUSES.MEDICATED.id,
	STATUSES.RAGING_STRIKES.id,
]

interface Snapshot {
	// The event that applied the DoT(s).
	snapEvent: CastEvent

	// All statuses observed at the time of casting the snapshot.
	statuses: Status[]

	// DoT ticks that occurred under the current snapshot.
	ticks: NormalisedDamageEvent[]
}

export default class Snapshots extends Module {
	static handle = 'snapshots'
	static title = t('brd.snapshots.title')`Snapshots`
	static debug = false

	@dependency private combatants!: Combatants
	@dependency private data!: Data
	@dependency private util!: Util

	private snapshots: Snapshot[] = []
	private currentSnapshot?: Snapshot

	private targets = new Map<string, AbilityEvent[]>()

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: SNAPSHOTTERS}, this.onSnapshot)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: DOT_STATUSES}, this.onDotTick)
		this.addEventHook(['applydebuff', 'refreshdebuff'], this.onApply)
		this.addEventHook('removedebuff', this.onRemove)
	}

	private onApply(event: AbilityEvent) {
		const targetKey = `${event.targetID}-${event.targetInstance}`

		if (!this.targets.has(targetKey)) {
			this.targets.set(targetKey, [])
		}

		const target = this.targets.get(targetKey)
		if (target) {
			const index = target.findIndex(statusEvent =>
				statusEvent.ability.guid === event.ability.guid)

			if (index === -1) {
				target.push(event)
			}
		}
	}

	private onRemove(event: AbilityEvent) {
		const targetKey = `${event.targetID}-${event.targetInstance}`
		const targetStatuses = this.targets.get(targetKey)

		if (targetStatuses) {
			const index = targetStatuses.findIndex(status =>
				status.ability.guid === event.ability.guid)

			if (index > -1) {
				targetStatuses.splice(index, 1)
			}
		}
	}

	private getStatuses(event: CastEvent): Status[] {
		const playerStatuses = this.combatants.selected.getStatuses()
		const targetKey = `${event.targetID}-${event.targetInstance}`
		const targetStatuses = this.targets.get(targetKey) || []

		const statuses = [...playerStatuses, ...targetStatuses]
			.map((event: AbilityEvent) =>  this.data.getStatus(event.ability.guid) as Status)
			.filter(status => status)
			.filter(status => !SNAPSHOT_BLACKLIST.includes(status.id))

		this.debug(statuses)

		return statuses
	}

	private onSnapshot(event: CastEvent) {
		if (this.currentSnapshot) {
			this.snapshots.push(this.currentSnapshot)
		}

		this.currentSnapshot = {
			snapEvent: event,
			statuses: this.getStatuses(event),
			ticks: [],
		}
	}

	private onDotTick(event: NormalisedDamageEvent) {
		// This will come in handy in the future
		this.currentSnapshot?.ticks.push(event)
	}

	output() {
		if (this.snapshots.length === 0) {
			return
		}

		// Builds a row for each snapshot event
		const rows = this.snapshots.map(snap => {

			snap.statuses.sort((a, b) => a.name.localeCompare(b.name))

			// Move personal buffs to the front of the status list
			snap.statuses.map((status, index) => {
				if (PERSONAL_STATUSES.includes(status.id)) {
					snap.statuses.unshift(
						snap.statuses.splice(index, 1)[0],
					)
				}
			})

			const dotStatusLinks: JSX.Element[] = []
			const buffStatusLinks: JSX.Element[] = []

			snap.statuses.map(status => {
				const id = status.id
				const statusLink = <StatusLink key={id} showName={false} iconSize="35px" {...status}/>
				if (DOT_STATUSES.includes(id)) {
					dotStatusLinks.push(statusLink)
				} else {
					buffStatusLinks.push(statusLink)
				}
			})

			const event = snap.snapEvent
			return <Table.Row key={event.timestamp}>
				<Table.Cell>
					{this.util.createTimelineButton(event.timestamp)}
				</Table.Cell>
				<Table.Cell>
					<ActionLink {...this.data.getAction(event.ability.guid)}/>
				</Table.Cell>
				<Table.Cell> {dotStatusLinks} </Table.Cell>
				<Table.Cell> {buffStatusLinks} </Table.Cell>
			</Table.Row>
		})

		// Output is a Table, where every row after the header contains individual snapshots
		return <Table>
			<Table.Header>
				<Table.Row key="header">
					<Table.HeaderCell><Trans id="brd.snapshots.time">Time</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="brd.snapshots.snapshotter">Snapshotter</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="brd.snapshots.dots">DoTs</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="brd.snapshots.statuses">Statuses</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{rows}
			</Table.Body>
		</Table>
	}
}
