/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import Module from 'parser/core/Module'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

//const DROP_TOLERANCE = 1000

export default class DoTs extends Module {
	static handle = 'dots'
	static dependencies = [
		'checklist',
		'util',
	]

	//_dotComponent = new DotComponent(STATUSES.CAUSTIC_BITE.id, STATUSES.STORMBITE.id)

	constructor(...args) {
		super(...args)

		/*const dotFilter = {
			by: 'player',
			abilityId: [STATUSES.CAUSTIC_BITE.id, STATUSES.STORMBITE.id],
		}*/

		//this.addEventHook('applydebuff', dotFilter, this._onDotApply)
		//this.addEventHook('removedebuff', dotFilter, this._onDotRemove)
		this.addEventHook('complete', this._onComplete)

	}

	_onDotApply(event) {
		this._dotComponent[event.ability.guid].apply(event.timestamp)
	}

	_onDotRemove(event) {
		this._dotComponent[event.ability.guid].remove(event.timestamp)
	}

	_onComplete() {

		this.checklist.add(new Rule({
			name: 'Keep your DoTs up',
			description: <> Most of Bard's DPS comes either directly or indirectly from <ActionLink {...ACTIONS.STORMBITE}/> and <ActionLink {...ACTIONS.CAUSTIC_BITE}/>.
				Make sure you have these skills applied on the target at all times. Use <ActionLink {...ACTIONS.IRON_JAWS}/> to refresh the timer on the Damage over Time (DoT) debuff.
			</>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Fragment><StatusLink {...STATUSES.STORMBITE} /> uptime</Fragment>,
					percent: () => this.util.getDebuffUptime(STATUSES.STORMBITE),
				}),
				new Requirement({
					name: <Fragment><StatusLink {...STATUSES.CAUSTIC_BITE} /> uptime</Fragment>,
					percent: () => this.util.getDebuffUptime(STATUSES.CAUSTIC_BITE),
				}),
			],
		}))
	}
}

/*class DotComponent {

	constructor(...actions) {
		for (const action of actions) {
			this[action] = new DotObject()
		}
	}
}*/

/*class DotObject {
	_windows = []

	apply(t) {
		if (!this.isRunning()) {
			// Two possible scenarios:

			// 1) The dot didn't actually drop, was just a hiccup
			if (this._windows.length && t - this._windows[this._windows.length - 1].end <= DROP_TOLERANCE) {
				this._windows[this._windows.length - 1].end = undefined

			// 2) The dot wasn't up to begin with or actually dropped
			} else {
				this._windows.push({start: t})
			}
		}
	}

	remove(t) {
		if (this.isRunning() && this._windows.length) {
			this._windows[this._windows.length - 1].end = t
		}
	}

	isRunning() {
		return this._windows.length && !this._windows[this._windows.length - 1].end
	}
}*/
