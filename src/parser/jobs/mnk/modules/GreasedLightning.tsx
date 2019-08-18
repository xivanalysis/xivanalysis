import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import Color from 'color'
import TimeLineChart from 'components/ui/TimeLineChart'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'

import {BuffEvent, BuffStackEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import BrokenLog from 'parser/core/modules/BrokenLog'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Invulnerability from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const GL_MAX_STACKS = 4

const GL_TIMEOUT_MILLIS = STATUSES.GREASED_LIGHTNING.duration * 1000

const GL_REFRESHERS = [
	STATUSES.GREASED_LIGHTNING.id,
	STATUSES.EARTHS_REPLY.id,
	ACTIONS.TORNADO_KICK.id,
]

interface CurrentStacks {
	stack: number
	timestamp: number
}

interface RoE {
	clean: boolean
	timestamp: number
}

export default class GreasedLightning extends Module {
	static handle = 'greasedlightning'
	static title = t('mnk.gl.title')`Greased Lightning`
	static displayOrder = DISPLAY_ORDER.GREASED_LIGHTNING

	@dependency private brokenLog!: BrokenLog
	@dependency private checklist!: Checklist
	@dependency private invuln!: Invulnerability
	@dependency private suggestions!: Suggestions

	// This kinda assumes starting a fight at zero, which is going to be 99% of the time.
	// onGain will cover most cases but if it's non-zero, onRefresh gonna be weird.
	// There's no way to actually tell their stacks at the start of a fight tho.
	private currentStacks: CurrentStacks = {stack: 0, timestamp: this.parser.fight.start_time}
	private droppedStacks: number = 0
	private lastRefresh?: number

	private usedTornadoKick: boolean = false

	private stacks: CurrentStacks[] = []

	private earthSaves: RoE[] = []
	private wastedEarth = 0

	protected init(): void {
		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.GREASED_LIGHTNING.id}, this.onGain)
		this.addHook('applybuffstack', {to: 'player', abilityId: STATUSES.GREASED_LIGHTNING.id}, this.onRefresh)
		this.addHook('removebuff', {to: 'player', abilityId: STATUSES.GREASED_LIGHTNING.id}, this.onDrop)

		// Cast will drop TK
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.TORNADO_KICK.id}, this.onTornadoKick)

		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.RIDDLE_OF_EARTH.id}, this.onRoE)
		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.EARTHS_REPLY.id}, this.onReply)

		this.addHook('complete', this.onComplete)
	}

	normalise(events: TODO[]) {
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
					currentStacks = 1
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

	private onGain(event: BuffEvent): void {
		this.currentStacks = {
			stack: 1,
			timestamp: event.timestamp,
		}

		this.lastRefresh = event.timestamp
		this.stacks.push(this.currentStacks)
	}

	private onRefresh(event: BuffStackEvent): void {
		if (event.stack > this.currentStacks.stack) {
			this.currentStacks = {
				stack: event.stack,
				timestamp: event.timestamp,
			}

			this.stacks.push(this.currentStacks)
		}

		this.lastRefresh = event.timestamp
	}

	private onRoE(event: BuffEvent): void {
		this.earthSaves.unshift({clean: false, timestamp: event.timestamp})
	}

	private onReply(event: BuffEvent): void {
		if (this.lastRefresh && event.timestamp - this.lastRefresh > GL_TIMEOUT_MILLIS) {
			this.wastedEarth++
		} else {
			this.lastRefresh = event.timestamp
		}

		this.earthSaves[0].clean = true
	}

	private onTornadoKick(): void {
		this.usedTornadoKick = true
	}

	private onDrop(event: BuffEvent): void {
		this.currentStacks = {
			stack: 0,
			timestamp: event.timestamp,
		}

		if (!this.usedTornadoKick) {
			this.droppedStacks++
		}

		this.usedTornadoKick = false

		this.stacks.push(this.currentStacks)
	}

	private onComplete(): void {
		// Push the final GL count so that it lasts to the end of the fight
		this.stacks.push({...this.currentStacks, timestamp: this.parser.fight.end_time})

		// Check for broken GL transitions
		this.stacks.forEach((value, index) => {
			const last = this.stacks[index-1] || {}
			if ([1, 2].includes(value.stack) && last.stack === GL_MAX_STACKS) {
				this.brokenLog.trigger(this, 'broken transition', (
					<Trans id="mnk.gl.trigger.broken-transition">
						<StatusLink {...STATUSES.GREASED_LIGHTNING}/> stacks were observed performing an impossible transition.
					</Trans>
				))
			}
		})

		// Count missed saves
		const missedEarth = this.earthSaves.filter(earth => !earth.clean).length

		this.checklist.add(new Rule({
			name: <Trans id="mnk.gl.checklist.name">Keep Greased Lightning running</Trans>,
			description: <Trans id="mnk.gl.checklist.description">
				<StatusLink {...STATUSES.GREASED_LIGHTNING}/> is a huge chunk of MNK's damage, increasing your damage by 30% and attack speed by 15%.
			</Trans>,
			displayOrder: DISPLAY_ORDER.GREASED_LIGHTNING,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.gl.checklist.requirement.name"><StatusLink {...STATUSES.GREASED_LIGHTNING}/> uptime</Trans>,
					percent: () => this.getUptimePercent(),
				}),
			],
			// Assuming slowest possible GCD, using 1 TK every 90s should be just over 92% uptime
			// TODO: use a metric based on good TK recovery to adjust this lower
			target: 92,
		}))

		if (this.droppedStacks) {
			this.suggestions.add(new Suggestion({
				icon: 'https://xivapi.com/i/001000/001775.png', // Name of Lightning
				content: <Trans id="mnk.gl.suggestions.dropped.content">
					Avoid dropping stacks except when using <ActionLink {...ACTIONS.TORNADO_KICK} />.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="mnk.gl.suggestions.dropped.why">
					<StatusLink {...STATUSES.GREASED_LIGHTNING} /> dropped <Plural value={this.droppedStacks} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		if (missedEarth) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RIDDLE_OF_EARTH.icon,
				content: <Trans id="mnk.gl.suggestions.roe.missed.content">
					Avoid using <ActionLink {...ACTIONS.RIDDLE_OF_EARTH} /> when you won't take any damage.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="mnk.gl.suggestions.roe.missed.why">
					<ActionLink {...ACTIONS.RIDDLE_OF_EARTH} /> was used <Plural value={missedEarth} one="# time" other="# times" /> without triggering <StatusLink {...STATUSES.EARTHS_REPLY} />.
				</Trans>,
			}))
		}

		if (this.wastedEarth) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.RIDDLE_OF_EARTH.icon,
				content: <Trans id="mnk.gl.suggestions.roe.wasted.content">
					Avoid using <ActionLink {...ACTIONS.RIDDLE_OF_EARTH} /> if your stacks won't drop.
					<StatusLink {...STATUSES.FISTS_OF_EARTH} /> has the same defensive buff on its own,
					unless you need the prolonged defense of <StatusLink {...STATUSES.EARTHS_REPLY} />.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="mnk.gl.suggestions.roe.wasted.why">
					<ActionLink {...ACTIONS.RIDDLE_OF_EARTH} /> was used <Plural value={this.wastedEarth} one="# time" other="# times" /> without preserving <StatusLink {...STATUSES.GREASED_LIGHTNING} />.
				</Trans>,
			}))
		}
	}

	getUptimePercent() {
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		const statusUptime = this.stacks.reduce((duration, value, index) => {
			const last = this.stacks[index-1] || {}
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
		/* tslint:disable no-magic-numbers */
		const data = {
			datasets: [{
				label: 'GL Stacks',
				data: this.stacks.map(({stack, timestamp}) => ({y: stack, t: timestamp - this.parser.fight.start_time})),
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
		/* tslint:enable no-magic-numbers */
	}
}
