import _ from 'lodash'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
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
		})
	}

	_onComplete() {
		this._statuses.forEach(st => {
			const stid = 'status-' + st.status.id
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

			this._groups[stid].addItem(new Item({
				type: 'background',
				className: this._groups[stid].className,
				start: st.start,
				end: st.end || st.start + st.status.duration * 1000,
				content: `<img src="${st.status.icon}" alt="${st.status.name}"/>`,
				limitSize: false,
			}))

		})
	}
}
