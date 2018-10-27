import Color from 'color'
import React, {Fragment} from 'react'
import TimeLineChart from 'components/ui/TimeLineChart'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'

import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const GL_MAX_STACKS = 3

const GL_TIMEOUT_MILLIS = STATUSES.GREASED_LIGHTNING_I.duration * 1000

const GL_REFRESHERS = [
	STATUSES.GREASED_LIGHTNING_I.id,
	STATUSES.EARTHS_REPLY.id,
	ACTIONS.TORNADO_KICK.id,
]

export default class GreasedLightning extends Module {
	static handle = 'greasedlightning'
	static title = 'Greased Lightning'
	static dependencies = [
		'brokenLog',
		'checklist',
		'combatants',
		'invuln',
		'suggestions',
	]

	static displayOrder = DISPLAY_ORDER.GREASED_LIGHTNING

	_currentStacks = null
	_droppedStacks = 0
	_lastRefresh = 0

	_usedTornadoKick = false

	_stacks = []

	_earthSaves = []
	_wastedEarth = 0

	_windSaves = []
	_wastedWind = 0

	constructor(...args) {
		super(...args)

		const GL_FILTER = {to: 'player', abilityId: STATUSES.GREASED_LIGHTNING_I.id}
		this.addHook('applybuff', GL_FILTER, this._onGlGain)
		this.addHook('applybuffstack', GL_FILTER, this._onGlRefresh)
		this.addHook('removebuff', GL_FILTER, this._onDrop)

		this.addHook('damage', {by: 'player', abilityId: ACTIONS.TORNADO_KICK.id}, this._onTornadoKick)

		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.RIDDLE_OF_WIND.id}, this._onRoWGain)
		this.addHook('damage', {by: 'player', abilityId: ACTIONS.RIDDLE_OF_WIND.id}, this._onRoWUse)

		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.RIDDLE_OF_EARTH.id}, this._onRoE)
		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.EARTHS_REPLY.id}, this._onReply)

		this.addHook('complete', this._onComplete)
	}

	normalise(events) {
		let currentStacks = 0
		let lastStackEvent = {timestamp: this.parser.fight.start_time}
		let usedTornadoKick = false

		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Ignore any non-ability events
			if (!event.ability) {
				continue
			}

			// Skip any non-GL related events
			if (!GL_REFRESHERS.includes(event.ability.guid)) {
				continue
			}

			// If the status is Earth's Reply and the last GL change was within the timeout
			switch (event.ability.guid) {
			case (STATUSES.EARTHS_REPLY.id):
				if (event.timestamp - lastStackEvent.timestamp < GL_TIMEOUT_MILLIS) {
					const newEvent = {
						...lastStackEvent,
						timestamp: event.timestamp,
					}

					events.splice(i, 0, newEvent)
					lastStackEvent = newEvent
					i++
				}

				break
			case (ACTIONS.TORNADO_KICK.id):
				currentStacks = 0
				usedTornadoKick = true

				break
			default:
				if (event.type === 'removebuff') {
					// We didn't TK and saved stacks with RoE (no timeout), delete false drop
					if (!usedTornadoKick && event.timestamp - lastStackEvent.timestamp < GL_TIMEOUT_MILLIS) {
						events.splice(i, 1)
						i--
						continue
					}

					// We timed out, reset stacks
					if (event.timestamp - lastStackEvent.timestamp >= GL_TIMEOUT_MILLIS) {
						currentStacks = 0
					}
				}

				// We have stacks so GL1 after false drop should be changed to real stacks
				if (currentStacks > 0 && event.type === 'applybuff') {
					event.type = 'applybuffstack'
				}

				// If it's still an applybuff, make sure we're recording the correct current stack count
				if (event.type === 'applybuff') {
					currentStacks = event.stack || 1
				}

				// Fall through to reapply
				if (event.type === 'applybuffstack') {
					currentStacks = Math.min(currentStacks + 1, GL_MAX_STACKS)
					event.stack = currentStacks
				}

				// Reset TK
				usedTornadoKick = false

				// Commit the event with adjusted stacks/types
				// TODO: maybe put a guard around this
				events[i] = lastStackEvent = event
			}
		}

		return events
	}

	_onGlGain(event) {
		this._currentStacks = {
			stack: event.stack || 1,
			timestamp: event.timestamp,
		}

		this._lastRefresh = event.timestamp
		this._stacks.push(this._currentStacks)
	}

	_onGlRefresh(event) {
		if (event.stack > this._currentStacks.stack) {
			this._currentStacks = {
				stack: event.stack,
				timestamp: event.timestamp,
			}

			this._stacks.push(this._currentStacks)
		}

		this._lastRefresh = event.timestamp
	}

	_onRoE(event) {
		this._earthSaves.unshift({clean: false, timestamp: event.timestamp})
	}

	_onReply(event) {
		if (event.timestamp - this._lastRefresh > GL_TIMEOUT_MILLIS) {
			this._wastedEarth++
		} else {
			this._lastRefresh = event.timestamp
		}

		this._earthSaves[0].clean = true
	}

	_onRoWGain(event) {
		this._windSaves.unshift({clean: false, timestamp: event.timestamp})
	}

	_onRoWUse(event) {
		// Ignore if we're building stacks
		if (!this._currentStacks || this._currentStacks.stack < GL_MAX_STACKS) {
			this._windSaves.shift()
			return
		}

		// This is kinda derpy since it really depends on GCD length but,
		// if we're in Coeurl and it's still live, there was no point to RoW.
		// If we're not in Coeurl we'll assume stacks were gonna drop.
		if (this.combatants.selected.hasStatus(STATUSES.COEURL_FORM.id)) {
			if (event.timestamp - this._lastRefresh < GL_TIMEOUT_MILLIS) {
				this._wastedWind++
			}
		} else {
			this._lastRefresh = event.timestamp
		}

		this._windSaves[0].clean = true
	}

	_onTornadoKick() {
		this._usedTornadoKick = true
	}

	_onDrop(event) {
		this._currentStacks = {
			stack: 0,
			timestamp: event.timestamp,
		}

		if (!this._usedTornadoKick) {
			this._droppedStacks++
		}

		this._usedTornadoKick = false

		this._stacks.push(this._currentStacks)
	}

	_onComplete() {
		// Push the final GL count so that it lasts to the end of the fight
		this._stacks.push({...this._currentStacks, timestamp: this.parser.fight.end_time})

		// Check for broken GL transitions
		this._stacks.forEach((value, index) => {
			const last = this._stacks[index-1] || {}
			if ([1, 2].includes(value.stack) && last.stack === GL_MAX_STACKS) {
				this.brokenLog.trigger()
			}
		})

		// Push wasted saves
		this._earthSaves.forEach(earth => {
			if (!earth.clean) {
				this._wastedEarth++
			}
		})

		this._windSaves.forEach(wind => {
			if (!wind.clean) {
				this._wastedWind++
			}
		})

		this.checklist.add(new Rule({
			name: 'Keep Greased Lightning running',
			description: <Fragment>
				<StatusLink {...STATUSES.GREASED_LIGHTNING_I}/> is a huge chunk of MNK's damage, increasing your damage by 30% and attack speed by 15%.
			</Fragment>,
			displayOrder: DISPLAY_ORDER.GREASED_LIGHTNING,
			requirements: [
				new Requirement({
					name: <Fragment><StatusLink {...STATUSES.GREASED_LIGHTNING_I}/> uptime</Fragment>,
					percent: () => this.getUptimePercent(),
				}),
			],
			// Assuming slowest possible GCD, using 1 TK every 90s should be just over 92% uptime
			// TODO: use a metric based on good TK recovery to adjust this lower
			target: 92,
		}))

		if (this._droppedStacks > 0) {
			this.suggestions.add(new Suggestion({
				icon: 'https://secure.xivdb.com/img/game/001000/001775.png', // Name of Lightning
				content: <Fragment>
					Avoid dropping stacks except when using <ActionLink {...ACTIONS.TORNADO_KICK} />.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					<StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> dropped {this._droppedStacks} times.
				</Fragment>,
			}))
		}

		if (this._wastedEarth > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RIDDLE_OF_EARTH.icon,
				content: <Fragment>
					Check the fight timeline to see when you can save <StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> with <ActionLink {...ACTIONS.RIDDLE_OF_EARTH} />.
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					<ActionLink {...ACTIONS.RIDDLE_OF_EARTH} /> was used {this._wastedEarth} times without triggering <StatusLink {...STATUSES.EARTHS_REPLY} />,
				</Fragment>,
			}))
		}

		if (this._wastedWind > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RIDDLE_OF_WIND.icon,
				content: <Fragment>
					Check the fight timeline to see when you can save <StatusLink {...STATUSES.GREASED_LIGHTNING_I} /> with <ActionLink {...ACTIONS.RIDDLE_OF_WIND} />.
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					<ActionLink {...ACTIONS.RIDDLE_OF_WIND} /> was used {this._wastedWind} times without preserving <StatusLink {...STATUSES.GREASED_LIGHTNING_I} />,
				</Fragment>,
			}))
		}
	}

	getUptimePercent() {
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		const statusUptime = this._stacks.reduce((duration, value, index) => {
			const last = this._stacks[index-1] || {}
			if ([0, GL_MAX_STACKS].includes(value.stack) && last.stack === GL_MAX_STACKS) {
				duration += value.timestamp - last.timestamp
			}

			return duration
		}, 0)

		return (statusUptime / fightUptime) * 100
	}

	output() {
		// TODO: figure out how to make this graph at least 3x shorter in height

		// Disabling magic numbers for the chart, 'cus it's a chart
		/* eslint-disable no-magic-numbers */
		const data = {
			datasets: [{
				label: 'GL Stacks',
				data: this._stacks.map(({stack, timestamp}) => ({y: stack, t: timestamp - this.parser.fight.start_time})),
				backgroundColor: Color(JOBS.MONK.colour).fade(0.5),
				borderColor: Color(JOBS.MONK.colour).fade(0.2),
				steppedLine: true,
			}],
		}

		const options = {
			legend: {display: false},
			tooltips: {enabled: false},
			scales: {
				yAxes: [{
					ticks: {
						max: 3,
						stepSize: 1,
					},
				}],
			},
		}

		return <TimeLineChart
			data={data}
			options={options}
			height={50}
		/>
		/* eslint-enable no-magic-numbers */
	}
}
