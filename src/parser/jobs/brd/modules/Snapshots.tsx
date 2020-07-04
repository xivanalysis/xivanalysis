import React from 'react'
import {Trans} from '@lingui/react'
import {t} from '@lingui/macro'
import {Table} from 'semantic-ui-react'
import Module, {dependency} from 'parser/core/Module'
import {getDataBy} from 'data'
import {CastEvent} from 'fflogs'
import STATUSES from 'data/STATUSES'
import {SNAPSHOT_BLACKLIST} from 'parser/jobs/brd/modules/SnapshotBlacklist'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Combatants from 'parser/core/modules/Combatants'
import {AbilityEvent} from 'fflogs'
import Util from './Util'

const SNAPSHOTTERS = [
	ACTIONS.IRON_JAWS.id,
	ACTIONS.CAUSTIC_BITE.id,
	ACTIONS.STORMBITE.id,
	ACTIONS.VENOMOUS_BITE.id,
	ACTIONS.WINDBITE.id,
]

const DOT_STATUSES = [
	STATUSES.CAUSTIC_BITE.id,
	STATUSES.STORMBITE.id,
	STATUSES.VENOMOUS_BITE.id,
	STATUSES.WINDBITE.id,
]

const PERSONAL_STATUSES = [
	STATUSES.MEDICATED.id,
	STATUSES.RAGING_STRIKES.id,
]

interface Snapshot {
	// The event that applied the DoT(s).
	snapEvent: CastEvent

	// All statuses observed at the time of casting the snapshot.
	statusIDs: number[]

	// DoT ticks that occurred under the current snapshot.
	ticks: NormalisedDamageEvent[]
}

export default class Snapshots extends Module {
	static handle = 'snapshots'
	static title = t('brd.snapshots.title')`Snapshots`
	static debug = true

	@dependency private combatants!: Combatants
	@dependency private util!: Util

	private snapshots: Snapshot[] = []
	private currentSnapshot?: Snapshot

	private targets = new Map<string, AbilityEvent[]>()

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: SNAPSHOTTERS}, this._onSnapshot)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: DOT_STATUSES}, this._onDotTick)
		this.addEventHook(['applydebuff', 'refreshdebuff'], this._onApply)
		this.addEventHook('removedebuff', this._onRemove)
	}

	private _onApply(event: AbilityEvent) {
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

	private _onRemove(event: AbilityEvent) {
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

	private _getStatuses(event: CastEvent) {
		const targetKey = `${event.targetID}-${event.targetInstance}`
		const playerStatuses = this.combatants.selected.getStatuses().map(
			(status: AbilityEvent) => status.ability.guid)
		const targetStatuses = this.targets.get(targetKey)?.map(
			(status: AbilityEvent) => status.ability.guid) || []

		return [...playerStatuses, ...targetStatuses]
	}

	private _onSnapshot(event: CastEvent) {
		if (this.currentSnapshot) {
			this.snapshots.push(this.currentSnapshot)
		}

		this.currentSnapshot = {
			snapEvent: event,
			statusIDs: this._getStatuses(event),
			ticks: [],
		}
	}

	private _onDotTick(event: NormalisedDamageEvent) {
		// This will come in handy in the future
		this.currentSnapshot?.ticks.push(event)
	}

	output() {
		if (this.snapshots.length === 0) {
			return
		}

		// Builds a row for each snapshot event
		const rows = this.snapshots.map(snap => {

			snap.statusIDs.sort()

			// Move personal buffs to the front of the status list
			snap.statusIDs.map((status, index) => {
				if (PERSONAL_STATUSES.includes(status)) {
					snap.statusIDs.unshift(
						snap.statusIDs.splice(index, 1)[0],
					)
				}
			})

			const snapshotDotCell = <Table.Cell>
				{
					snap.statusIDs.map(id => {
						const status = getDataBy(STATUSES, 'id', id)
						if (status && DOT_STATUSES.includes(id)) {
							return <StatusLink key={status.name} showName={false} iconSize="35px" {...status}/>
						}
					})
				}
			</Table.Cell>

			const snapshotBuffCell = <Table.Cell>
				{
					snap.statusIDs.map(id => {
						// Avoid showing statuses we do not currently know of and statuses known not to affect bard DoTs
						const status = getDataBy(STATUSES, 'id', id)
						if (status && !DOT_STATUSES.includes(id) && !SNAPSHOT_BLACKLIST.includes(id)) {
							return <StatusLink key={id} showName={false} iconSize="35px" {...status}/>
						}
					})
				}
			</Table.Cell>

			const event = snap.snapEvent
			return <Table.Row key={event.timestamp}>
				<Table.Cell>
					{this.util.createTimelineButton(event.timestamp)}
				</Table.Cell>
				<Table.Cell>
					<ActionLink {...getDataBy(ACTIONS, 'id', event.ability.guid)}/>
				</Table.Cell>
				{snapshotDotCell}
				{snapshotBuffCell}
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
