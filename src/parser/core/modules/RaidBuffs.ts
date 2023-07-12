import {JobKey} from 'data/JOBS'
import {Status, StatusKey} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Team} from 'report'
import {Analyser} from '../Analyser'
import {filter, oneOf} from '../filter'
import {dependency} from '../Injectable'
import {Actor, Actors} from './Actors'
import {Data} from './Data'
import {SimpleRow, StatusItem, Timeline} from './Timeline'

// Are other jobs going to need to add to this?
interface StatusConfig {
	key: StatusKey
	group?: string
	name?: string,
	exclude?: JobKey[]
}

const TRACKED_STATUSES: StatusConfig[] = [
	{key: 'THE_BALANCE', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_ARROW', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_SPEAR', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_BOLE', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_EWER', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_SPIRE', group: 'arcanum', name: 'Arcanum'},
	{key: 'DIVINATION'},
	{key: 'BATTLE_LITANY'},
	{key: 'BATTLE_VOICE'},
	{key: 'BROTHERHOOD'},
	{key: 'CHAIN_STRATAGEM'},
	{key: 'EMBOLDEN_SELF'}, // tracking the self buff so it appears on the RDM's perspective
	{key: 'EMBOLDEN_PARTY'},
	{key: 'LEFT_EYE', exclude: ['DRAGOON']}, // notDRG
	{key: 'TECHNICAL_FINISH'},
	{key: 'STANDARD_FINISH_PARTNER'},
	{key: 'DEVILMENT'},
	{key: 'OFF_GUARD'},
	{key: 'PECULIAR_LIGHT'},
	{key: 'CONDENSED_LIBRA_ASTRAL', group: 'libra', name: 'Condensed Libra'},
	{key: 'CONDENSED_LIBRA_UMBRAL', group: 'libra', name: 'Condensed Libra'},
	{key: 'CONDENSED_LIBRA_PHYSICAL', group: 'libra', name: 'Condensed Libra'},
	{key: 'ARCANE_CIRCLE'},
	{key: 'SEARING_LIGHT'},
	{key: 'RADIANT_FINALE'},
]

export class RaidBuffs extends Analyser {
	static override handle = 'raidBuffs'

	@dependency private readonly actors!: Actors
	@dependency private readonly data!: Data
	@dependency private readonly timeline!: Timeline

	private applications = new Map<Actor['id'], Map<Status['id'], number>>()
	private timelineRows = new Map<string | number, SimpleRow>()
	private settings = new Map<Status['id'], StatusConfig>(
		TRACKED_STATUSES.map(config => [this.data.statuses[config.key].id, config])
	)

	override initialise() {
		// Patch-specific raid buff additions
		if (this.parser.patch.before('6.1')) {
			this.settings.set(
				this.data.statuses.TRICK_ATTACK_VULNERABILITY_UP.id,
				{key: 'TRICK_ATTACK_VULNERABILITY_UP', name: 'Trick Attack'}
			)
		} else {
			this.settings.set(
				this.data.statuses.MUG_VULNERABILITY_UP.id,
				{key: 'MUG_VULNERABILITY_UP', name: 'Mug'}
			)
		}

		// Event hooks
		const statusFilter = filter<Event>()
			.status(oneOf([...this.settings.keys()]))
			.target((target: Actor['id']): target is Actor['id'] => {
				// Match all foes, but only the parsed actor of the friends.
				const actor = this.actors.get(target)
				if (actor.team === Team.FRIEND) {
					return actor.id === this.parser.actor.id
				}
				return true
			})
		this.addEventHook(statusFilter.type('statusApply'), this.onApply)
		this.addEventHook(statusFilter.type('statusRemove'), this.onRemove)
		this.addEventHook('complete', this.onComplete)
	}

	private onApply(event: Events['statusApply']) {
		const statusId = event.status
		const settings = this.settings.get(statusId)

		if (settings?.exclude?.includes(this.parser.actor.job)) {
			return
		}

		// Record the start time of the status
		const applications = this.getTargetApplications(event.target)
		if (!applications.has(statusId)) {
			applications.set(statusId, event.timestamp)
		}
	}

	private onRemove(event: Events['statusRemove']) {
		this.endStatus(event.target, event.status)
	}

	private endStatus(targetId: Actor['id'], statusId: Status['id']) {
		const applications = this.getTargetApplications(targetId)
		const applyTime = applications.get(statusId)
		if (!applyTime) { return }
		applications.delete(statusId)

		const settings = this.settings.get(statusId)
		const status = this.data.getStatus(statusId)
		if (settings == null || status == null) { return }

		// Get the row for this status/group, creating one if it doesn't exist yet.
		// NOTE: Using application time as order, as otherwise adding here forces ordering by end time of the first status
		const rowId = settings.group ?? statusId
		let row = this.timelineRows.get(rowId)
		if (row == null) {
			row = new SimpleRow({
				label: settings.name ?? status.name,
				order: applyTime,
			})
			this.timelineRows.set(rowId, row)
		}

		const start = applyTime - this.parser.pull.timestamp

		// It's not uncommon for a status to be mirrored onto mechanic actors, which
		// causes a big bunch-up of statuses in the timeline. If there's already an
		// item for this application, skip out.
		if (row.items[row.items.length - 1]?.start === start) {
			return
		}

		// Add an item for the status to its row
		row.addItem(new StatusItem({
			start,
			end: this.parser.currentEpochTimestamp - this.parser.pull.timestamp,
			status,
		}))
	}

	private onComplete() {
		// Clean up any remnant statuses
		for (const [targetId, statuses] of this.applications) {
			for (const statusId of statuses.keys()) {
				this.endStatus(targetId, statusId)
			}
		}

		// Add the parent row. It will automatically hide if there's no children.
		this.timeline.addRow(new SimpleRow({
			label: 'Raid Buffs',
			order: -100,
			rows: Array.from(this.timelineRows.values()),
		}))
	}

	private getTargetApplications(targetId: Actor['id']) {
		let applications = this.applications.get(targetId)
		if (applications == null) {
			applications = new Map()
			this.applications.set(targetId, applications)
		}
		return applications
	}
}
