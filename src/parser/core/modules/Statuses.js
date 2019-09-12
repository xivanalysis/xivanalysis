import _ from 'lodash'

import ACTIONS from 'data/ACTIONS'
import STATUSES, {STATUS_EFFECT_TYPES} from 'data/STATUSES'
import Module from 'parser/core/Module'
import {ItemGroup, Item} from './Timeline'
import {getDataBy} from 'data'

// Track the cooldowns on actions and shit
export default class Statuses extends Module {
	static handle = 'statuses'
	static dependencies = [
		'timeline',
		// need this module to be executed after gcd to have gcd group created in timeline
		'cooldowns', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'gcd', // eslint-disable-line @xivanalysis/no-unused-dependencies
	]

	STATUSES_STACK_MAPPING = {
		[STATUSES.WALKING_DEAD.id]: STATUSES.LIVING_DEAD.id,
		[STATUSES.GIANT_DOMINANCE.id]: STATUSES.EARTHLY_DOMINANCE.id,
		[STATUSES.DIVINE_VEIL_AFTER_HEAL.id]: STATUSES.DIVINE_VEIL.id,
	}

	_statuses = [];
	_groups = {}

	constructor(...args) {
		super(...args)

		this.addHook('complete', this._onComplete)
		this.addHook('applybuff', {by: 'player'}, this._onApply)
		this.addHook('applydebuff', {by: 'player'}, this._onApply)
		this.addHook('refreshdebuff', {by: 'player'}, this._onRefresh)
		this.addHook('refreshbuff', {by: 'player'}, this._onRefresh)
		this.addHook('removebuff', {by: 'player'}, this._onRemove)
		this.addHook('removedebuff', {by: 'player'}, this._onRemove)

		this.addHook('applybuff', {by: 'pet'}, this._onApply)
		this.addHook('applydebuff', {by: 'pet'}, this._onApply)
		this.addHook('refreshdebuff', {by: 'pet'}, this._onRefresh)
		this.addHook('refreshbuff', {by: 'pet'}, this._onRefresh)
		this.addHook('removebuff', {by: 'pet'}, this._onRemove)
		this.addHook('removedebuff', {by: 'pet'}, this._onRemove)
	}

	_onApply(event) {
		if (this.parser.report.friendlyPets.some(p => p.id === event.targetID)) {
			return
		}
		const status = getDataBy(STATUSES, 'id', event.ability.guid)

		if (!status) {
			return
		}

		this._addStatus(event, status)
	}

	_onRefresh(event) {
		if (this.parser.report.friendlyPets.some(p => p.id === event.targetID)) {
			return
		}

		const status = getDataBy(STATUSES, 'id', event.ability.guid)

		if (!status) {
			return
		}

		this._updatePrevStatus(event, status)

		this._addStatus(event, status)
	}

	_onRemove(event) {
		if (this.parser.report.friendlyPets.some(p => p.id === event.targetID)) {
			return
		}

		const status = getDataBy(STATUSES, 'id', event.ability.guid)

		if (!status) {
			return
		}

		this._updatePrevStatus(event, status)
	}

	_updatePrevStatus(event, status) {
		const prev = _.findLast(this._statuses, it => it.status.id === status.id)

		if (prev) {
			prev.end = event.timestamp - this.parser.fight.start_time
		}
	}

	_addStatus(event, status) {
		if (this._statuses.some(it => {
			const diff = Math.abs(event.timestamp - this.parser.fight.start_time - it.start)
			return it.status.id === status.id && diff <= 2 * 1000
		})) {
			return
		}

		this._statuses.push({
			start: event.timestamp - this.parser.fight.start_time,
			status: status,
			target: this._getTargetName(event),
		})
	}

	_getTargetName(event) {
		if (event.targetIsFriendly) {
			if (event.targetID === this.parser.player.id) {
				return 'Self'
			}
			const target = this.parser.report.friendlies.find(it => it.id === event.targetID)
			if (target) {
				return target.name + ' (' + target.type + ')'
			}
		}
		const target = this.parser.report.enemies.find(it => it.id === event.targetID)
		if (target) {
			return target.name
		}

		return 'Unknown'
	}

	_onComplete() {
		this._statuses.forEach(st => {
			const stid = 'status-' + (this.STATUSES_STACK_MAPPING[st.status.id] || st.status.id)
			if (!this._groups[stid]) {
				// register new group

				// find action for status
				const action = Object.values(ACTIONS).find(it => {
					return it.statusesApplied && it.statusesApplied.some(s => s && s.id === st.status.id)
				})

				if (!action) {
					return
				}

				const group = new ItemGroup({
					id: stid,
					content: st.status.name,
					showNested: false,
					className: action.onGcd ? '' : 'highlight',
				})

				this.timeline.attachToGroup(action.onGcd ? 'gcd' : action.id, group)

				this._groups[stid] = group
			}

			const color = this._lookForColor(st.status)

			this._groups[stid].addItem(new Item({
				type: 'background',
				style: color && `background-color:${color};`,
				className: this._groups[stid].className,
				start: st.start,
				end: st.end || st.start + st.status.duration * 1000,
				content: `<img src="${st.status.icon}" alt="${st.status.name}" title="Used on: ${st.target}"/>`,
				limitSize: false,
			}))

		})
	}

	_lookForColor(status) {
		const setting = Object.values(STATUS_EFFECT_TYPES)
			.find(value => {
				return value.ids.some(id => id === status.id)
			})
		return setting && setting.settings && setting.settings.color || ''
	}
}
