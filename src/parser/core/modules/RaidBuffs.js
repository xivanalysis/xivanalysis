import React from 'react'

import JOBS from 'data/JOBS'
import Module from 'parser/core/Module'
import {Group, Item} from 'parser/core/modules/Timeline'

// Are other jobs going to need to add to this?
// const OLD_RAID_BUFFS = {
// 	[STATUSES.THE_BALANCE.id]: {group: 'arcanum', name: 'Arcanum'},
// 	[STATUSES.THE_ARROW.id]: {group: 'arcanum', name: 'Arcanum'},
// 	[STATUSES.THE_SPEAR.id]: {group: 'arcanum', name: 'Arcanum'},
// 	[STATUSES.THE_BOLE.id]: {group: 'arcanum', name: 'Arcanum'},
// 	[STATUSES.THE_EWER.id]: {group: 'arcanum', name: 'Arcanum'},
// 	[STATUSES.THE_SPIRE.id]: {group: 'arcanum', name: 'Arcanum'},
// 	[STATUSES.LORD_OF_CROWNS.id]: {group: 'arcanum', name: 'Arcanum'},
// 	[STATUSES.LADY_OF_CROWNS.id]: {group: 'arcanum', name: 'Arcanum'},
// 	[STATUSES.DIVINATION.id]: {},
// 	[STATUSES.BATTLE_LITANY.id]: {},
// 	[STATUSES.BATTLE_VOICE.id]: {exclude: [JOBS.BARD.logType]},
// 	[STATUSES.BROTHERHOOD.id]: {},
// 	[STATUSES.CHAIN_STRATAGEM.id]: {},
// 	[STATUSES.EMBOLDEN_PHYSICAL.id]: {}, // phys only?
// 	[STATUSES.LEFT_EYE.id]: {exclude: [JOBS.DRAGOON.logType]}, // notDRG
// 	[STATUSES.TRICK_ATTACK_VULNERABILITY_UP.id]: {name: 'Trick Attack'},
// 	[STATUSES.DEVOTION.id]: {},
// 	[STATUSES.TECHNICAL_FINISH.id]: {},
// 	[STATUSES.STANDARD_FINISH_PARTNER.id]: {},
// 	[STATUSES.DEVILMENT.id]: {},
// }

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
		'timeline',
		'enemies',
	]

	_group = null
	_buffs = {}

	_buffMap = new Map()

	constructor(...args) {
		super(...args)

		// Set up a group that'll act as a parent for all our stuff
		this._group = new Group({
			id: 'raidbuffs',
			content: 'Raid Buffs',
			order: -100,
			nestedGroups: [],
		})
		this.timeline.addGroup(this._group)

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

		// Make sure there's a nested group for us
		const groupId = 'raidbuffs-' + (settings.group || statusId)
		if (!this._group.nestedGroups.includes(groupId)) {
			this.timeline.addGroup(new Group({
				id: groupId,
				content: settings.name || event.ability.name,
			}))
			this._group.nestedGroups.push(groupId)
		}

		// Generate an item for the buff
		// TODO: startTime should probably be automated inside timeline
		const startTime = this.parser.fight.start_time
		const status = this.data.getStatus(statusId)
		if (!status) { return }
		buffs[statusId] = new Item({
			type: 'background',
			start: event.timestamp - startTime,
			group: groupId,
			content: <img src={status.icon} alt={status.name}/>,
		})
	}

	_onRemove(event) {
		// Only track active enemies
		if (event.type.includes('debuff') && !this.enemies.isActive(event.targetID, event.targetInstance)) {
			return
		}

		const item = this.getTargetBuffs(event)[event.ability.guid]
		// This shouldn't happen, but it do.
		if (!item) { return }

		item.end = event.timestamp - this.parser.fight.start_time
		this.timeline.addItem(item)
	}

	_onComplete() {
		// If there's no buffs at all (:eyes:), hide the group
		if (Object.keys(this._buffs).length === 0) {
			this._group.visible = false
		}
	}

	getTargetBuffs(event) {
		return this._buffs[event.targetID] = this._buffs[event.targetID] || {}
	}
}
