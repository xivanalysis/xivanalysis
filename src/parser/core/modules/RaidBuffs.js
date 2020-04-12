import JOBS from 'data/JOBS'
import Module from 'parser/core/Module'
import {SimpleRow, StatusItem} from 'parser/core/modules/Timeline'

// Are other jobs going to need to add to this?
const RAID_BUFFS = [
	{key: 'THE_BALANCE', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_ARROW', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_SPEAR', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_BOLE', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_EWER', group: 'arcanum', name: 'Arcanum'},
	{key: 'THE_SPIRE', group: 'arcanum', name: 'Arcanum'},
	{key: 'LORD_OF_CROWNS', group: 'arcanum', name: 'Arcanum'},
	{key: 'LADY_OF_CROWNS', group: 'arcanum', name: 'Arcanum'},
	{key: 'DIVINATION'},
	{key: 'BATTLE_LITANY'},
	{key: 'BATTLE_VOICE', exclude: [JOBS.BARD.logType]},
	{key: 'BROTHERHOOD'},
	{key: 'CHAIN_STRATAGEM'},
	{key: 'EMBOLDEN_PHYSICAL'}, // phys only?
	{key: 'LEFT_EYE', exclude: [JOBS.DRAGOON.logType]}, // notDRG
	{key: 'TRICK_ATTACK_VULNERABILITY_UP', name: 'Trick Attack'},
	{key: 'DEVOTION'},
	{key: 'TECHNICAL_FINISH'},
	{key: 'STANDARD_FINISH_PARTNER'},
	{key: 'DEVILMENT'},
	{key: 'OFF_GUARD'},
	{key: 'PECULIAR_LIGHT'},
]

export default class RaidBuffs extends Module {
	static handle = 'raidBuffs'
	static dependencies = [
		'data',
		'enemies',
		'timeline',
	]

	_buffs = {}

	_buffRows = new Map()

	_buffMap = new Map()

	constructor(...args) {
		super(...args)

		RAID_BUFFS.forEach(obj => {
			this._buffMap.set(this.data.statuses[obj.key].id, obj)
		})

		// Event hooks
		const filter = {abilityId: [...this._buffMap.keys()]}
		this.addHook('applybuff', {...filter, to: 'player'}, this._onApply)
		this.addHook('applydebuff', filter, this._onApply)
		this.addHook('removebuff', {...filter, to: 'player'}, this._onRemove)
		this.addHook('removedebuff', filter, this._onRemove)
		this.addHook('complete', this._onComplete)
	}

	_onApply(event) {
		// Only track active enemies when it's a debuff
		if (event.type.includes('debuff') && !this.enemies.isActive(event.targetID, event.targetInstance)) {
			return
		}

		const buffs = this.getTargetBuffs(event)
		const statusId = event.ability.guid
		const settings = this._buffMap.get(statusId)

		if (settings.exclude && settings.exclude.includes(this.parser.player.type)) {
			return
		}

		// Record the start time of the status
		buffs[statusId] = event.timestamp - this.parser.fight.start_time
	}

	_onRemove(event) {
		// Only track active enemies
		if (event.type.includes('debuff') && !this.enemies.isActive(event.targetID, event.targetInstance)) {
			return
		}

		const statusId = event.ability.guid

		const applyTime = this.getTargetBuffs(event)[statusId]
		// This shouldn't happen, but it do.
		if (!applyTime) { return }

		const removeTime = event.timestamp - this.parser.fight.start_time

		const settings = this._buffMap.get(statusId)
		const status = this.data.getStatus(statusId)
		if (!status) { return }

		// Get the row for this buff/group, creating one if it doesn't exist yet.
		// NOTE: Using application time as order, as otherwise adding here forces ordering by end time of the first buff
		const rowId = settings.group || statusId
		let row = this._buffRows.get(rowId)
		if (row == null) {
			row = new SimpleRow({
				label: settings.name || event.ability.name,
				order: applyTime,
			})
			this._buffRows.set(rowId, row)
		}

		// Add an item for the buff to its row
		row.addItem(new StatusItem({
			start: applyTime,
			end: removeTime,
			status,
		}))
	}

	_onComplete() {
		// Add the parent row. It will automatically hide if there's no children.
		this.timeline.addRow(new SimpleRow({
			label: 'Raid Buffs',
			order: -100,
			rows: Array.from(this._buffRows.values()),
		}))
	}

	getTargetBuffs(event) {
		return this._buffs[event.targetID] = this._buffs[event.targetID] || {}
	}
}
