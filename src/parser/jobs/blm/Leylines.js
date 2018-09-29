import React, {Fragment} from 'react'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import Module from 'parser/core/Module'
import {ActionLink} from 'components/ui/DbLink'
import {i18nMark, Trans} from '@lingui/react'
import {Accordion} from 'semantic-ui-react'
import VisTimeline from 'react-visjs-timeline'
import vis from 'vis/dist/vis-timeline-graph2d.min'
import {Group, Item} from 'parser/core/modules/Timeline'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const LEYLINE_DURATION = 30000
const SERVER_TICK_BUFFER = 3000

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
	_leyLineHistory = []
	_buffs = {}
	_group = null

	constructor(...args) {
		super(...args)
		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.LEY_LINES.id,
		}, this._onCastLeyLines)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.CIRCLE_OF_POWER.id,
		}, this._onApplyCircleOfPower)
		this.addHook('applybuff', {
			by: 'player',
			abilityId: STATUSES.LEY_LINES.id,
		}, this._onApplyBuff)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.CIRCLE_OF_POWER.id,
		}, this._onRemoveCircleOfPower)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.LEY_LINES.id,
		}, this._onLoseBuff)
		this.addHook('complete', this._onComplete)

		this._group = new Group({
			id: 'leybuffs',
			content: 'Ley Lines Buffs',
			order: 0,
			nestedGroups: [],
		})
		this.timeline.addGroup(this._group)
	}

	_onCastLeyLines(event) { this._leyLineHistory.push(event.timestamp) }

	// _onApplyBuff and _onLostBuff retooled from RaidBuffs.js
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

	//TODO: make a better one that tracks actual LL durations so that you don't have to filter out the last LL use in a fight.
	_percentFunction(numberOfLeyLines, sumOfCoPUpTime) {
		return (sumOfCoPUpTime/(numberOfLeyLines*LEYLINE_DURATION))*100
	}

	_onComplete(event) {
		if (this._circleOfPowers.current) {
			if (!this._circleOfPowers.current.stop) {
				this._circleOfPowers.current.stop = event.timestamp
			}
			this._circleOfPowers.history.push(this._circleOfPowers.current)
		}
		//check if there even were any events
		if (!this._circleOfPowers.history.length) { return }
		//filter out the last possible LL usage because it would make things weird.
		this._circleOfPowers.history = this._circleOfPowers.history.filter(cops => cops.start < (event.timestamp - LEYLINE_DURATION))
		this._leyLineHistory = this._leyLineHistory.filter(timestamps => timestamps < (event.timestamp - LEYLINE_DURATION))
		const circleOfPowerDurations = this._circleOfPowers.history.map(cops => Math.max(cops.stop - cops.start, 0))
		const sumOfCoPUpTime = circleOfPowerDurations.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
		const numberOfLeyLines = this._leyLineHistory.length

		this.checklist.add(new Rule({
			name: <Trans id="blm.leylines.checklist-caption">Stay in your Ley Lines</Trans>,
			description: <Trans id="blm.leylines.checklist">Try to avoid leaving your Ley Lines after placing them. Take advantage of Ley Lines' size to stay in them while dodging AOEs and being in range of healers. If you can't stay in them for the majority of a Ley Lines' duration, consider changing where they're placed in the fight.</Trans>,
			requirements: [
				new Requirement({
					name: <ActionLink {...ACTIONS.LEY_LINES} />,
					percent: this._percentFunction(numberOfLeyLines, sumOfCoPUpTime),
				}),
			],
			//pretty random. Should be revised, maybe based on fights? 10% is ~ 1 GCD. So we allow that.
			target: 90,
		}))
	}

	output() {
		const panels = this._leyLineHistory.map(timestamp => {
			const options = {
				// General styling
				width: '100%',
				align: 'left',
				stack: false,
				showCurrentTime: false,

				// Date/time formatting
				moment: (date) => vis.moment(date).utc(),
				maxMinorChars: 4,
				format: {
					minorLabels: {
						minute: 'm[m]',
					},
					majorLabels: {
						second: 'm[m]',
						minute: '',
					},
				},

				// View constraints
				min: timestamp - this.parser.fight.start_time,
				max: timestamp + LEYLINE_DURATION - this.parser.fight.start_time,
				zoomMin: 10000,

				// View defaults
				// Show first minute by default, full fight view is a bit hard to grok.
				start: timestamp - this.parser.fight.start_time,
				end: timestamp + LEYLINE_DURATION - this.parser.fight.start_time,
			}

			// Get the uptime percentage of Circle of Power for this Ley Lines usage
			// Note: we need to filter for Circle of Power events that end up to a server tick after the Ley Lines buff duration due to the way the CoP buff is handled
			const thisHistory = this._circleOfPowers.history.filter(cops => ((cops.start >= timestamp) & (cops.stop <= timestamp + LEYLINE_DURATION + SERVER_TICK_BUFFER)))
			const thisUptime = thisHistory.map(cops => Math.max(cops.stop - cops.start, 0)).reduce((accumulator, currentValue) => accumulator + currentValue, 0)
			const thisPercent = this._percentFunction(1, thisUptime).toFixed(0)

			return {
				key: 'title-' + timestamp,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(timestamp)}
						&nbsp;-&nbsp;{thisPercent}% uptime
					</Fragment>,
				},
				content: {
					content: <VisTimeline
						options={options}
						groups={this.timeline._groups.map(group => group.getObject())}
						items={this.timeline._items.map(item => item.getObject())}
					/>,
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
