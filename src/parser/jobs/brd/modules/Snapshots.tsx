import React from 'react'
import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {Table, Accordion} from 'semantic-ui-react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import ACTIONS from 'data/ACTIONS'
import STATUSES, {Status} from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {SNAPSHOT_BLACKLIST} from './SnapshotBlacklist'
import Util from './Util'

import styles from './Snapshots.module.css'

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

const BAD_REFRESH_SEVERITY = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	3: SEVERITY.MAJOR,
}

interface Snapshot {
	// The event that applied the DoT(s).
	snapshotter: CastEvent

	// All statuses observed at the time of casting the snapshot.
	statuses: Status[]

	// Indicates whether the snap was an IJ that did not refresh DoTs.
	badRefresh: boolean
}

class Target {
	public name: string
	public key: string
	readonly snapshots: Snapshot[] = []
	private statuses: Status[] = []

	constructor(name: string, key: string) {
		this.name = name
		this.key = key
	}

	public addStatus(status: Status) {
		if (!this.statuses.includes(status)) {
			this.statuses.push(status)
		}
	}

	public removeStatus(status: Status) {
		const index = this.statuses.indexOf(status)
		if (index > -1) {
			this.statuses.splice(index, 1)
		}
	}

	public addSnapshot(snap: CastEvent, playerStatuses: Status[]) {
		// If IJ didn't refresh both DoTs, it was a misuse
		const isBadRefresh = (
			snap.ability.guid === ACTIONS.IRON_JAWS.id &&
			(!this.statuses.includes(STATUSES.CAUSTIC_BITE) ||
			!this.statuses.includes(STATUSES.STORMBITE))
		)

		this.snapshots.push({
			snapshotter: snap,
			statuses: [...this.statuses, ...playerStatuses],
			badRefresh: isBadRefresh,
		})
	}
}

export default class Snapshots extends Module {
	static handle = 'snapshots'
	static title = t('brd.snapshots.title')`Snapshots`
	static debug = false

	@dependency private combatants!: Combatants
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private util!: Util

	private targets: Map<string, Target> = new Map()

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: SNAPSHOTTERS}, this.onSnapshot)
		this.addEventHook(['applydebuff', 'refreshdebuff'], this.onApply)
		this.addEventHook('removedebuff', this.onRemove)
		this.addEventHook('complete', this.onComplete)
	}

	private onApply(event: BuffEvent) {
		if (event.targetIsFriendly) { return }

		const target = this.getTarget(event)
		const status = this.data.getStatus(event.ability.guid)
		if (status) {
			target.addStatus(status)
		}
	}

	private onRemove(event: BuffEvent) {
		if (event.targetIsFriendly) { return }

		const target = this.getTarget(event)
		const status = this.data.getStatus(event.ability.guid)
		if (status) {
			target.removeStatus(status)
		}
	}

	private onSnapshot(event: CastEvent) {
		const target = this.getTarget(event)
		target.addSnapshot(event, this.playerStatuses)
	}

	private getTarget(fields: {targetID?: number, targetInstance?: number}): Target {
		const targetKey = `${fields.targetID}-${fields.targetInstance}`
		let target = this.targets.get(targetKey)

		if (target == null) {
			const targetName = this.parser.pull.actors
				.find(actor => actor.id === fields.targetID?.toString())
				?.name ?? 'Unknown Enemy' // Default to "Unknown Enemy" if we can't find a name

			target = new Target(targetName, targetKey)
			this.targets.set(targetKey, target)
		}

		return target
	}

	private get playerStatuses(): Status[] {
		const statuses = this.combatants.selected.getStatuses()
			.map((event: BuffEvent) => this.data.getStatus(event.ability.guid))
			.filter((status: Status | null) => status != null && !SNAPSHOT_BLACKLIST.includes(status.id))

		return statuses
	}

	private onComplete() {
		const badRefreshes = Array.from(this.targets.values(), target => target.snapshots)
			.reduce((acc, snap) => acc.concat(snap))
			.filter(snap => snap.badRefresh)
			.length

		const moduleLink = <a
			style={{cursor: 'pointer'}}
			onClick={() => this.parser.scrollTo(Snapshots.handle)}><NormalisedMessage message={Snapshots.title}/>
		</a>

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.IRON_JAWS.icon,
			content: <Trans id="brd.snapshots.suggestions.content">
				Avoid using <ActionLink {...ACTIONS.IRON_JAWS} /> when <ActionLink {...ACTIONS.CAUSTIC_BITE} /> and <ActionLink {...ACTIONS.STORMBITE} /> are not present on the target. These Iron Jaws are highlighted in the {moduleLink} module below.
			</Trans>,
			why: <Trans id="brd.snapshots.suggestions.why">
				Iron Jaws was used on a target with at least one missing DoT <Plural value={badRefreshes} one="# time" other="# times"/>.
			</Trans>,
			tiers: BAD_REFRESH_SEVERITY,
			value: badRefreshes,
		}))
	}

	private createSnapshotTable(target: Target): JSX.Element {
		// Returns a collapsable snapshot table for the target
		const rows = target.snapshots.map(snap => {

			snap.statuses.sort((a, b) => a.name.localeCompare(b.name))

			// Move personal buffs to the front of the status list
			snap.statuses.forEach((status, index) => {
				if (PERSONAL_STATUSES.includes(status.id)) {
					snap.statuses.unshift(
						snap.statuses.splice(index, 1)[0],
					)
				}
			})

			const dotStatusLinks: JSX.Element[] = []
			const buffStatusLinks: JSX.Element[] = []

			snap.statuses.forEach(status => {
				const id = status.id
				const statusLink = <StatusLink key={id} showName={false} iconSize="35px" {...status}/>
				if (DOT_STATUSES.includes(id)) {
					dotStatusLinks.push(statusLink)
				} else {
					buffStatusLinks.push(statusLink)
				}
			})

			const event = snap.snapshotter
			return <Table.Row key={event.timestamp} warning={snap.badRefresh}>
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

	output() {
		if (this.targets.size === 0) {
			return null
		}

		if (this.targets.size === 1) {
			return this.createSnapshotTable(this.targets.values().next().value)

		} else {
			const panels = Array.from(this.targets.values(), target => {
				return {
					key: target.key,
					title: {
						content: <span className={styles.name}> {target.name} </span>,
					},
					content: {
						content: this.createSnapshotTable(target),
					},
				}
			})
			return <Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		}
	}
}
