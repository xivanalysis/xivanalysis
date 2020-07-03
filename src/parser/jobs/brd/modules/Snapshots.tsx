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
	statusIds: number[]

	// DoT ticks that occurred under the current snapshot.
	ticks: NormalisedDamageEvent[]
}

export default class Snapshots extends Module {
	static handle = 'snapshots'
	static title = t('brd.snapshots.title')`Snapshots`

	@dependency private combatants!: Combatants
	@dependency private util!: Util

	private snapshots: Snapshot[] = []
	private currentSnapshot?: Snapshot

	private targets = new Map<number, number[]>()

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: SNAPSHOTTERS}, this._onSnapshot)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: DOT_STATUSES}, this._onDotTick)
		this.addEventHook('applydebuff', this._onApply)
		this.addEventHook('removedebuff', this._onRemove)
	}

	private _onApply(event: AbilityEvent) {
		const targetID = event.targetID ?? -1
		if (!this.targets.has(targetID)) {
			this.targets.set(targetID, [])
		}

		this.targets.get(targetID)?.push(event.ability.guid)
	}

	private _onRemove(event: AbilityEvent) {
		const targetID = event.targetID || -1
		const targetStatuses = this.targets.get(targetID)
		const index = (targetStatuses ?? []).indexOf(event.ability.guid)
		if (index > -1) {
			targetStatuses?.splice(index, 1)
		}
	}

	private _getStatuses(event: CastEvent) {
		const playerStatuses = this.combatants.selected.getStatuses().map((status: AbilityEvent) => status.ability.guid)
		const targetStatuses = this.targets.get(event.targetID || -1) || []

		return [...playerStatuses, ...targetStatuses]
	}

	private _onSnapshot(event: CastEvent) {
		if (this.currentSnapshot) {
			this.snapshots.push(this.currentSnapshot)
		}

		this.currentSnapshot = {
			snapEvent: event,
			statusIds: this._getStatuses(event),
			ticks: [],
		}

		this.debug(this.currentSnapshot)
	}

	private _onDotTick(event: NormalisedDamageEvent) {
		this.currentSnapshot?.ticks.push(event)
	}

	output() {
		if (this.snapshots.length === 0) {
			return
		}

		// Builds a row for each snapshot event
		const rows = this.snapshots.map(snap => {

			snap.statusIds.sort()

			// Move personal buffs to the front of the status list
			snap.statusIds.map((status, index) => {
				if (PERSONAL_STATUSES.includes(status)) {
					snap.statusIds.unshift(
						snap.statusIds.splice(index, 1)[0],
					)
				}
			})

			const snapshotDotCell = <Table.Cell>
				{
					snap.statusIds.map(id => {
						const status = getDataBy(STATUSES, 'id', id)
						if (status && DOT_STATUSES.includes(id)) {
							return <StatusLink key={status.name} showName={false} iconSize="35px" {...status}/>
						}
					})
				}
			</Table.Cell>

			const snapshotBuffCell = <Table.Cell>
				{
					snap.statusIds.map(id => {
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
