import React, {Fragment} from 'react'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Module from 'parser/core/Module'
import {ActionLink} from 'components/ui/DbLink'
import {i18nMark, Trans} from '@lingui/react'
import {Accordion, Button} from 'semantic-ui-react'
import {Group, Item} from 'parser/core/modules/Timeline'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class Leylines extends Module {
	static handle = 'leylines'
	static i18n_id = i18nMark('blm.leylines.title')
	static title = 'Ley Lines'
	static displayOrder = DISPLAY_ORDER.LEY_LINES

	static dependencies = [
		'timeline',
		'checklist',
	]
	_circleOfPowers = {
		current: null,
		history: [],
	}
	_leyLines = {
		current: null,
		history: [],
	}
	_buffs = {}
	_group = null

	constructor(...args) {
		super(...args)

		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.CIRCLE_OF_POWER.id,
		}, this._onApplyCircleOfPower)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.LEY_LINES.id,
		}, this._onApplyLeyLines)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.CIRCLE_OF_POWER.id,
		}, this._onRemoveCircleOfPower)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.LEY_LINES.id,
		}, this._onRemoveLeyLines)
		this.addHook('complete', this._onComplete)

		this._group = new Group({
			id: 'leybuffs',
			content: 'Ley Lines Buffs',
			order: 0,
			nestedGroups: [],
		})
		this.timeline.addGroup(this._group)
	}

	// _onApplyBuff and _onLoseBuff retooled from RaidBuffs.js
	_onApplyBuff(event) {
		const buffs = this.getTargetBuffs(event)
		const statusId = event.ability.guid

		// Make sure there's a nested group for us
		const groupId = 'leybuffs-' + statusId
		if (!this._group.nestedGroups.includes(groupId)) {
			this.timeline.addGroup(new Group({
				id: groupId,
				content: event.ability.name,
			}))
			this._group.nestedGroups.push(groupId)
		}

		// Generate an item for the buff
		const startTime = this.parser.fight.start_time
		const status = STATUSES[statusId]
		buffs[statusId] = new Item({
			type: 'background',
			start: event.timestamp - startTime,
			group: groupId,
			content: <img src={status.icon} alt={status.name}/>,
		})
	}

	_onLoseBuff(event) {
		const item = this.getTargetBuffs(event)[event.ability.guid]
		// This shouldn't happen, but it do.
		if (!item) { return }

		item.end = event.timestamp - this.parser.fight.start_time
		this.timeline.addItem(item)
	}

	_onApplyLeyLines(event) {
		if (this._leyLines.current) { this._leyLines.history.push(this._leyLines.current) }

		this._leyLines.current = {
			start: event.timestamp,
			stop: null,
		}

		this._onApplyBuff(event)
	}

	_onRemoveLeyLines(event) {
		if (this._leyLines.current) {
			this._leyLines.current.stop = event.timestamp
		}
		this._onLoseBuff(event)
	}

	_onApplyCircleOfPower(event) {
		if (this._circleOfPowers.current) { this._circleOfPowers.history.push(this._circleOfPowers.current) }

		this._circleOfPowers.current = {
			start: event.timestamp,
			stop: null,
		}
		this._onApplyBuff(event) // Also track application time for UI
	}

	_onRemoveCircleOfPower(event) {
		if (this._circleOfPowers.current) {
			this._circleOfPowers.current.stop = event.timestamp
		}
		this._onLoseBuff(event) // Also track application time for accordion UI
	}

	_percentFunction(sumOfLeyLineDurations, sumOfCoPUpTime) {
		return (sumOfCoPUpTime/(sumOfLeyLineDurations))*100
	}

	_onComplete(event) {
		if (this._circleOfPowers.current) {
			if (!this._circleOfPowers.current.stop) {
				this._circleOfPowers.current.stop = event.timestamp
			}
			this._circleOfPowers.history.push(this._circleOfPowers.current)
		}
		if (this._leyLines.current) {
			if (!this._leyLines.current.stop) {
				this._leyLines.current.stop = event.timestamps
			}
			this._leyLines.history.push(this._leyLines.current)
		}
		//check if there even were any events
		if (!this._circleOfPowers.history.length) { return }
		if (!this._leyLines.history.length) { return }

		// Get the total duration of CoP uptime and ley lines, so we can get the overall percentage uptime
		const circleOfPowerDurations = this._circleOfPowers.history.map(cops => Math.max(cops.stop - cops.start, 0))
		const sumOfCoPUpTime = circleOfPowerDurations.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
		const leyLinesDurations = this._leyLines.history.map(lines => Math.max(lines.stop - lines.start, 0))
		const sumOfLeyLineDurations = leyLinesDurations.reduce((accumulator, currentValue) => accumulator + currentValue, 0)

		this.checklist.add(new Rule({
			name: <Trans id="blm.leylines.checklist-caption">Stay in your Ley Lines</Trans>,
			description: <Trans id="blm.leylines.checklist">Try to avoid leaving your Ley Lines after placing them. Take advantage of Ley Lines' size to stay in them while dodging AOEs and being in range of healers. If you can't stay in them for the majority of a Ley Lines' duration, consider changing where they're placed in the fight.</Trans>,
			requirements: [
				new Requirement({
					name: <ActionLink {...ACTIONS.LEY_LINES} />,
					percent: this._percentFunction(sumOfLeyLineDurations, sumOfCoPUpTime),
				}),
			],
			//pretty random. Should be revised, maybe based on fights? 10% is ~ 1 GCD. So we allow that.
			target: 90,
		}))
	}

	output() {
		const panels = this._leyLines.history.map(leyLinesEvent => {
			// Get the uptime percentage of Circle of Power for this Ley Lines usage
			const thisCoPHistory = this._circleOfPowers.history.filter(cops => ((cops.start >= leyLinesEvent.start) & (cops.stop <= leyLinesEvent.stop)))
			const thisCoPUptime = thisCoPHistory.map(cops => Math.max(cops.stop - cops.start, 0)).reduce((accumulator, currentValue) => accumulator + currentValue, 0)
			// Note that since we're getting the actual duration, rather than the expected duration, technically we'll call it 100% uptime if you stay in the lines and die halfway through...
			// However, since that'll get flagged as a morbid checklist item, that's probably ok.
			const thisLeyLinesDuration = leyLinesEvent.stop - leyLinesEvent.start
			const thisPercent = this._percentFunction(thisLeyLinesDuration, thisCoPUptime).toFixed(2)

			return {
				key: 'title-' + leyLinesEvent.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(leyLinesEvent.start)}
						&nbsp;-&nbsp;{thisPercent}% uptime
					</Fragment>,
				},
				content: {
					content: <Button onClick={() => this.timeline.show(leyLinesEvent.start - this.parser.fight.start_time, leyLinesEvent.stop - this.parser.fight.start_time)}><Trans id="blm.leylines.timelinebutton">View Timeline</Trans></Button>,
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

	getTargetBuffs(event) {
		return this._buffs[event.targetID] = this._buffs[event.targetID] || {}
	}
}
