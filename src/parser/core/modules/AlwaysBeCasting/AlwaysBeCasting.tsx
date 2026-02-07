import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {NormalisedMessage} from 'components/ui/NormalisedMessage'
import {Rotation} from 'components/ui/Rotation'
import {Action} from 'data/ACTIONS'
import {ANIMATION_LOCK} from 'data/CONSTANTS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CastTime} from 'parser/core/modules/CastTime'
import {Checklist, Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Downtime} from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SpeedAdjustments} from 'parser/core/modules/SpeedAdjustments'
import {ReactNode} from 'react'
import {Accordion, Button, Icon, Message, Table} from 'semantic-ui-react'
import {DISPLAY_ORDER} from '../DISPLAY_ORDER'
import {Timeline} from '../Timeline'
import {AlwaysBeCastingAnalyser} from './AlwaysBeCastingCommon'
import {Interrupts} from './Interrupts'
import {Weaving} from './Weaving'

const UPTIME_TARGET = 98

interface GcdUptimeEvent {
	time: number
	gcdUptime: number
}

//value to be added to the gcd to avoid false positives. 100ms for caster tax, 50ms for gcd jitter.
const GCD_ERROR_OFFSET = 150

//slide cast period is 500 ms.
const SLIDECAST_OFFSET = 500

interface GcdDowntimeWindow {
	start: number,
	leadingEvent: Events['action']
	trailingOgcds: Array<Events['action']>
	trailingEvent?: Events['action'] | Events['prepare']
	stop?: number
}

export class AlwaysBeCasting extends AlwaysBeCastingAnalyser {
	static override handle = 'abc'
	static override title = msg({id: 'core.abc.title', message: 'Always Be Casting'})
	static override displayOrder = DISPLAY_ORDER.ABC
	static override debug = false

	@dependency protected castTime!: CastTime
	@dependency protected checklist!: Checklist
	@dependency protected data!: Data
	@dependency protected downtime!: Downtime
	@dependency protected globalCooldown!: GlobalCooldown
	@dependency protected speedAdjustments!: SpeedAdjustments
	@dependency private timeline!: Timeline
	@dependency private weaving!: Weaving
	@dependency private interrupts!: Interrupts

	protected gcdUptimeSuggestionContent: JSX.Element = <Trans id="core.always-cast.description">
		Make sure you're always doing something. It's often better to make small
		mistakes while keeping the GCD rolling than it is to perform the correct
		rotation slowly.
	</Trans>

	protected gcdUptimeEvents: GcdUptimeEvent[] = []
	protected gcdsCounted: number = 0

	private lastBeginCast?: Events['prepare']

	private gcdDowntimeWindows: {current?: GcdDowntimeWindow, history: GcdDowntimeWindow[]} = {
		history: [],
	}
	private gcdLength = this.globalCooldown.getDuration()

	private outputModules: Array<{
		module: AlwaysBeCastingAnalyser,
		header: ReactNode,
		title?: ReactNode
	}> = [
			{
				module: this,
				title: <Trans id="core.always-cast.gcd-downtime.title">GCD Downtime</Trans>,
				header: <Trans id="core.always-cast.header.about">This report identifies when your GCD was idle and for how long.</Trans>,
			},
			{
				module: this.weaving,
				header: <Trans id="core.always-cast.header.weaving">This report identifies when your GCD was delayed by weaving too many cooldowns.</Trans>,
			},
			{
				module: this.interrupts,
				header: <Trans id="core.always-cast.header.interrupts">This report identifies when your GCD was wasted by interrupting a cast.</Trans>,
			},
		]

	override initialise() {
		this.addEventHook(
			filter<Event>().source(this.parser.actor.id).type('prepare'),
			this.onBeginCast
		)
		this.addEventHook(
			filter<Event>().source(this.parser.actor.id).type('action'),
			this.onCast
		)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	//reset to not count the time you lie on the ground as time you aren't casting : ^)
	private onDeath() { this.gcdDowntimeWindows.current = undefined }

	private closeGcdDowntimeWindow(endTime: number, event: Events['action'] | Events['prepare'] | undefined = undefined) {
		const tracker = this.gcdDowntimeWindows

		// Already closed, nothing to do here
		if (!tracker.current) {
			return
		}

		const leadingEventGcdLength = this.castTime.recastForEvent(tracker.current.leadingEvent) ?? this.gcdLength
		// Add the current window to the history array if we've exceeded the GCD length
		if (endTime - tracker.current.start > leadingEventGcdLength + GCD_ERROR_OFFSET) {
			tracker.current.stop = endTime
			tracker.current.trailingEvent = event
			tracker.history.push(tracker.current)
		}

		tracker.current = undefined
	}

	private onBeginCast(event: Events['prepare']) {
		this.lastBeginCast = event
		this.closeGcdDowntimeWindow(event.timestamp, event)
	}

	private onCast(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		if (!action.onGcd) {
			this.gcdDowntimeWindows.current?.trailingOgcds.push(event)
			return
		}

		//coming from a hard cast, adjust for slidecasting
		const slidecastAdjustedTimestamp = event.timestamp + (this.lastBeginCast ? SLIDECAST_OFFSET : 0)
		this.closeGcdDowntimeWindow(slidecastAdjustedTimestamp, event)

		// Don't trust timestamps before the pull, they can be synthed and be wrong
		if (event.timestamp > this.parser.pull.timestamp) {
			//this cast is our new last cast
			this.gcdDowntimeWindows.current = {
				start: slidecastAdjustedTimestamp,
				leadingEvent: event,
				trailingOgcds: [],
			}
		}

		let castTime = this.castTime.forEvent(event) ?? 0
		const adjustedBaseGCD = this.globalCooldown.getDuration()
		if (castTime >= adjustedBaseGCD) {
			// Account for "caster tax" - animation lock on spells with cast time equal to or greater than the GCD that prevents starting the next spell until the animation finishes
			castTime += ANIMATION_LOCK
		}
		const recastTime = this.castTime.recastForEvent(event) ?? 0

		const castStart = (this.lastBeginCast != null && this.lastBeginCast.action === event.action) ? this.lastBeginCast.timestamp : event.timestamp
		if (this.considerCast(action, castStart)) {
			const gcdDuration = Math.max(castTime, recastTime)

			const relativeTimestamp = event.timestamp - this.parser.pull.timestamp
			const relativeEndTime = relativeTimestamp + gcdDuration

			if (castTime > relativeTimestamp) {
				const gcdUptime = relativeTimestamp - castTime + gcdDuration
				this.debug(`GCD Uptime for precast ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)} - Cast time: ${castTime} | Recast time: ${recastTime} | Time of completion: ${gcdUptime}`)
				this.gcdUptimeEvents.push({
					time: event.timestamp,
					gcdUptime: Math.max(0, gcdUptime),
				})
			} else if (relativeEndTime > this.parser.pull.duration) {
				const gcdUptime = this.parser.pull.timestamp + this.parser.pull.duration - event.timestamp
				this.debug(`GCD Uptime for end-of-fight ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)} - Cast time: ${castTime} | Recast time: ${recastTime} | In-combat uptime ${gcdUptime}`)
				this.gcdUptimeEvents.push({
					time: event.timestamp,
					gcdUptime: Math.max(0, gcdUptime),
				})
			} else {
				this.debug(`GCD Uptime for ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)} - Cast time: ${castTime} | Recast time: ${recastTime}`)
				this.gcdUptimeEvents.push({
					time: event.timestamp,
					gcdUptime: gcdDuration,
				})
			}
			this.gcdsCounted += 1
		} else {
			this.debug(`Excluding cast of ${action.name} at ${this.parser.formatEpochTimestamp(event.timestamp, 1)}`)
		}
		this.lastBeginCast = undefined
	}

	/**
	 * Implementing modules MAY override this to return false and exclude certain events from GCD uptime calculations.
	 * By default, returns true if the cast did not start during downtime
	 * @param action Action being considered for GCD uptime
	 * @param timestamp Timestamp the action occurred at
	 * @param castTime Calculated cast time of the action (adjusted by speed modifiers, if any active)
	 */
	protected considerCast(_action: Action, castStart: number) {
		return !this.downtime.isDowntime(castStart)
	}

	/* Must be accessed after all events have been processed */
	protected get gcdUptime(): number {
		return this.gcdUptimeEvents.reduce((totalUptime: number, event: GcdUptimeEvent) => {
			if (this.downtime.isDowntime(event.time + event.gcdUptime)) {
				// If the GCD ends in a downtime window, we only count the part that occurred in uptime
				this.debug(`GCD ends in downtime at ${this.parser.formatEpochTimestamp(event.time + event.gcdUptime)}`)
				const downtimeWindow = this.downtime.getDowntimeWindows(event.time, event.time + event.gcdUptime)[0]
				return totalUptime + (downtimeWindow?.start ?? event.time + event.gcdUptime) - event.time
			}
			return totalUptime + event.gcdUptime
		}, 0)
	}

	protected getUptimePercent(): number {
		this.debug(`Observed ${this.gcdsCounted} GCDs for a total of ${this.gcdUptime} ms of uptime`)
		const fightDuration = this.parser.currentDuration - this.downtime.getDowntime()
		const uptime = this.gcdUptime / fightDuration * 100
		this.debug(`Total fight duration: ${this.parser.currentDuration} - Downtime: ${this.downtime.getDowntime()} - Uptime percentage ${uptime}`)
		return uptime
	}

	protected onComplete(event: Events['complete']) {
		// Finish up with downtime tracking
		this.closeGcdDowntimeWindow(event.timestamp)

		// Filter out periods where you got stunned, boss is untargetable, etc, or windows with negative durations
		this.gcdDowntimeWindows.history = this.gcdDowntimeWindows.history.filter(windows => {
			const duration = this.downtime.getDowntime(
				windows.start,
				windows.stop ?? windows.start,
			)
			return duration === 0 && (windows.stop ?? windows.start) - windows.start > this.gcdLength + GCD_ERROR_OFFSET
		})
		// Filter out periods that duplicate detections from the weaving module
		this.gcdDowntimeWindows.history = this.gcdDowntimeWindows.history.filter(window => {
			return !this.weaving.badWeaves.some(badWeave => badWeave.leadingGcdEvent.action === window.leadingEvent.action && badWeave.leadingGcdEvent.timestamp === window.leadingEvent.timestamp)
		})

		if (this.gcdUptimeEvents.length === 0) {
			return
		}

		this.checklist.add(new Rule({
			name: <Trans id="core.always-cast.title">Always be casting</Trans>,
			description: this.gcdUptimeSuggestionContent,
			displayOrder: -1,
			requirements: [
				new Requirement({
					name: <Trans id="core.always-cast.gcd-uptime">GCD Uptime</Trans>,
					percent: this.getUptimePercent(),
				}),
			],
			target: UPTIME_TARGET,
		}))
	}

	override get hasIssues() {
		return this.gcdDowntimeWindows.history.length > 0
	}

	override getIssueData() {
		return this.gcdDowntimeWindows.history.map(window => {
			return {
				timestamp: window.start,
				delay: this.getDelayPerIssue(window),
				start: window.start - this.parser.pull.timestamp,
				stop: (window.stop ?? window.start) - this.parser.pull.timestamp,
				actionsContent: <Rotation events={[window.leadingEvent, ...window.trailingOgcds, window.trailingEvent].filter(event => event != null)} />,
				infoContent: <>{this.parser.formatDuration((window.stop ?? window.start) - window.leadingEvent.timestamp, 2)}&nbsp;<Trans id="core.weaving.between-gcds">between GCDs</Trans></>,
			}
		})
	}

	override getDelayPerIssue(downtime: GcdDowntimeWindow) {
		return (downtime.stop ?? downtime.start) - downtime.start - this.gcdLength
	}

	override getTotalDelay() {
		return this.gcdDowntimeWindows.history.reduce((acc, downtime) => acc + this.getDelayPerIssue(downtime), 0)
	}

	override output() {
		if (!this.outputModules.some(entry => entry.module.hasIssues)) { return }

		const filteredModules = this.outputModules.filter(entry => entry.module.hasIssues)
		const maxDelay = Math.max(...filteredModules.map(entry => entry.module.getTotalDelay()))
		const maxIndex = filteredModules.filter(entry => entry.module.hasIssues).findIndex(entry => entry.module.getTotalDelay() === maxDelay)

		return <>
			<Message icon>
				<Icon name="exclamation" />
				<Message.Content>
					<Trans id="core.always-cast.header.content">Keeping your GCD rolling is the most important component of maximizing your damage.</Trans>
					<br/>
					<Trans id="core.always-cast.header.sub-content">These reports will help identify ways you can improve on your GCD uptime.</Trans>
					<br/><br/>
					Total time lost: {this.parser.formatDuration(filteredModules.reduce((acc, entry) => acc + entry.module.getTotalDelay(), 2))}
				</Message.Content>
			</Message>
			<Accordion exclusive={false}
				styled
				fluid
				defaultActiveIndex={[maxIndex]}
				panels={
					filteredModules.map(entry => {
						const module = entry.module
						const moduleStatic = (module.constructor as typeof Analyser)
						const title = entry.title ? entry.title : moduleStatic.title ? <NormalisedMessage message={moduleStatic.title} /> : moduleStatic.handle
						return {
							key: moduleStatic.handle,
							title: {
								content: <>{title} - {this.parser.formatDuration(module.getTotalDelay(), 2)}</>,
							},
							content: {
								content: <>
									<Message info>
										{entry.header}
									</Message>
									<Table compact unstackable celled collapsing>
										<Table.Header>
											<Table.Row>
												<Table.HeaderCell collapsing><Trans id="core.always-cast.timestamp-header">Time</Trans></Table.HeaderCell>
												<Table.HeaderCell><Trans id="core.always-cast.gcd-delay-header">GCD Delay</Trans></Table.HeaderCell>
												<Table.HeaderCell><Trans id="core.always-cast.actions-header">Actions</Trans></Table.HeaderCell>
												{
													module.getIssueData().some(entry => entry.infoContent != null)
														? <Table.HeaderCell collapsing><Trans id="core.always-cast.info-header">Info</Trans></Table.HeaderCell>
														: <></>
												}
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{
												module.getIssueData().map(issue => {
													return <Table.Row key={issue.timestamp}>
														<Table.Cell textAlign="center">
															<span style={{marginRight: 5}}>{this.parser.formatEpochTimestamp(issue.timestamp)}</span>
															<Button
																circular
																compact
																size="mini"
																icon="time"
																onClick={() => this.timeline.show(Math.max(issue.start, 0), Math.min(issue.stop, this.parser.pull.duration))}
															/>
														</Table.Cell>
														<Table.Cell>{this.parser.formatDuration((issue.delay), 2)}</Table.Cell>
														<Table.Cell>
															{issue.actionsContent}
														</Table.Cell>
														{
															issue.infoContent != null
																? <Table.Cell>{issue.infoContent}</Table.Cell>
																: <></>
														}
													</Table.Row>
												})}
										</Table.Body>
									</Table>
								</>,
							},
						}
					})
				} />
		</>
	}
}
