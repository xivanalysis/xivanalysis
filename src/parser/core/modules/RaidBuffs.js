import Module, {executeBeforeDoNotUseOrYouWillBeFired} from 'parser/core/Module'
import {AdditionalEvents} from './AdditionalEvents'
import {SimpleRow, StatusItem} from './Timeline'
import {isDefined} from 'utilities'

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
	{key: 'BATTLE_VOICE', exclude: ['BARD']},
	{key: 'BROTHERHOOD'},
	{key: 'CHAIN_STRATAGEM'},
	{key: 'EMBOLDEN_PHYSICAL'}, // phys only?
	{key: 'LEFT_EYE', exclude: ['DRAGOON']}, // notDRG
	{key: 'TRICK_ATTACK_VULNERABILITY_UP', name: 'Trick Attack'},
	{key: 'DEVOTION'},
	{key: 'TECHNICAL_FINISH'},
	{key: 'STANDARD_FINISH_PARTNER'},
	{key: 'DEVILMENT'},
	{key: 'OFF_GUARD'},
	{key: 'PECULIAR_LIGHT'},
]

@executeBeforeDoNotUseOrYouWillBeFired(AdditionalEvents)
class RaidBuffsQuery extends Module {
	static handle = 'raidBuffsQuery'
	static dependencies = [
		'additionalEventQueries',
		'data',
		'enemies',
	]

	normalise(events) {
		// Abilities we need more info on
		const abilities = [
			this.data.statuses.TRICK_ATTACK_VULNERABILITY_UP.id,
			this.data.statuses.CHAIN_STRATAGEM.id,
			this.data.statuses.RUINATION.id,
		]

		this.additionalEventQueries.registerQuery(`type in ('applydebuff','removedebuff') and ability.id in (${abilities.join(',')}) and (${this._buildActiveTargetQuery()})`)

		return events
	}

	// We only want events on "active" targets - lots of mirror copies used for mechanics that fluff up the data otherwise
	_buildActiveTargetQuery = () =>
		Object.keys(this.enemies.activeTargets)
			.map(actorId => {
				const actor = this.enemies.getEntity(Number(actorId))
				if (!actor) {
					return
				}

				const instances = this.enemies.activeTargets[actorId]
				let query = '(target.id=' + actor.guid
				if (instances.size > 0) {
					query += ` and target.instance in (${Array.from(instances).join(',')})`
				}
				return query + ')'
			})
			.filter(isDefined)
			.join(' or ')
}
export {RaidBuffsQuery}

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
		this.addEventHook('applybuff', {...filter, to: 'player'}, this._onApply)
		this.addEventHook('applydebuff', filter, this._onApply)
		this.addEventHook('removebuff', {...filter, to: 'player'}, this._onRemove)
		this.addEventHook('removedebuff', filter, this._onRemove)
		this.addEventHook('complete', this._onComplete)
	}

	_onApply(event) {
		// Only track active enemies when it's a debuff
		if (event.type.includes('debuff') && !this.enemies.isActive(event.targetID, event.targetInstance)) {
			return
		}

		const buffs = this.getTargetBuffs(event.targetID)
		const statusId = event.ability.guid
		const settings = this._buffMap.get(statusId)

		if (settings.exclude && settings.exclude.includes(this.parser.actor.job)) {
			return
		}

		// Record the start time of the status
		buffs[statusId] = event.timestamp - this.parser.eventTimeOffset
	}

	_onRemove(event) {
		// Only track active enemies
		if (event.type.includes('debuff') && !this.enemies.isActive(event.targetID, event.targetInstance)) {
			return
		}

		this._endStatus(event.targetID, event.ability.guid)
	}

	_endStatus(targetId, statusId) {
		const targetBuffs = this.getTargetBuffs(targetId)
		const applyTime = targetBuffs[statusId]
		// This shouldn't happen, but it do.
		if (!applyTime) { return }
		delete targetBuffs[statusId]

		const removeTime = this.parser.currentTimestamp - this.parser.eventTimeOffset

		const settings = this._buffMap.get(statusId)
		const status = this.data.getStatus(statusId)
		if (!status) { return }

		// Get the row for this buff/group, creating one if it doesn't exist yet.
		// NOTE: Using application time as order, as otherwise adding here forces ordering by end time of the first buff
		const rowId = settings.group || statusId
		let row = this._buffRows.get(rowId)
		if (row == null) {
			row = new SimpleRow({
				label: settings.name || status.name,
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
		// Clean up any remnant statuses
		Object.entries(this._buffs).forEach(([targetId, buffs]) =>
			Object.keys(buffs).forEach(buffId =>
				this._endStatus(targetId, Number(buffId)),
			),
		)

		// Add the parent row. It will automatically hide if there's no children.
		this.timeline.addRow(new SimpleRow({
			label: 'Raid Buffs',
			order: -100,
			rows: Array.from(this._buffRows.values()),
		}))
	}

	getTargetBuffs(targetId) {
		return this._buffs[targetId] = this._buffs[targetId] || {}
	}
}
