import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {ActionLink, DataLink, StatusLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {CastTime} from 'parser/core/modules/CastTime'
import {Checklist, Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SimpleRow, StatusItem, Timeline} from 'parser/core/modules/Timeline'
import {Table, Button, Message, Icon} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// Number of ms to allow the actual ley lines buff duration to be shorter than nominal before we show the buff duration/cast count table columns
const BUFF_DURATION_JITTER_MS = 500

interface LeyLinesWindow {
	start: number,
	casts: number,
	stop?: number
}

interface LeyLinesWindows {
	current?: LeyLinesWindow,
	history: LeyLinesWindow[]
}

export class Leylines extends Analyser {
	static override handle = 'leylines'
	static override title = msg({id: 'blm.leylines.title', message: 'Ley Lines'})
	static override displayOrder = DISPLAY_ORDER.LEY_LINES

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private checklist!: Checklist
	@dependency private timeline!: Timeline
	@dependency private castTime!: CastTime
	@dependency private globalCooldown!: GlobalCooldown

	private leyLinesStatuses: number[] = [
		this.data.statuses.LEY_LINES.id,
		this.data.statuses.CIRCLE_OF_POWER.id,
	]

	private buffWindows: {[key: number]: LeyLinesWindows} = {}
	private castTimeIndex: number | null = null

	private leyLinesRow!: SimpleRow

	private preparesEventHook: EventHook<Events['prepare']> | null = null
	private actionEventHook: EventHook<Events['action']> | null = null
	private interruptEventHook: EventHook<Events['interrupt']> | null = null

	private linesActionId: Action['id'] | null = null
	private circleActionId: Action['id'] | null = null

	// Only count cast events if we're at patch 7.2 or beyond. Prior to that patch, GCD lengths were not consistent.
	private countCasts = !this.parser.patch.before('7.2')

	private checklistName = <Trans id="blm.leylines.checklist-caption">Stay in your <ActionLink {...this.data.actions.LEY_LINES} /></Trans>
	private checklistDescription = <Trans id="blm.leylines.checklist">Try to avoid leaving your <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} /> after placing them. Take advantage of <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} />' size to stay in them while dodging AOEs and being in range of healers. If you can't stay in them for the majority of a <ActionLink showIcon={false} {...this.data.actions.LEY_LINES} />' duration, consider changing where they're placed in the fight.</Trans>

	override initialise() {
		const leyLinesFilter = filter<Event>()
			.source(this.parser.actor.id)
			.status(oneOf(this.leyLinesStatuses))
		this.addEventHook(leyLinesFilter.type('statusApply'), this.onGain)
		this.addEventHook(leyLinesFilter.type('statusRemove'), this.onDrop)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onDeath)
		this.addEventHook('complete', this.onComplete)

		this.leyLinesStatuses.forEach(status => {
			this.buffWindows[status] = {history: []}
		})

		// Build the grouping row
		this.leyLinesRow = this.timeline.addRow(new SimpleRow({
			label: 'Ley Lines Buffs',
			order: 0,
		}))
	}

	public getStatusDurationInRange(
		statusId: number,
		start: number = this.parser.pull.timestamp,
		end: number = this.parser.pull.timestamp + this.parser.pull.duration
	) {
		let duration = 0
		for (const window of this.buffWindows[statusId].history) {
			if (window.stop == null || window.stop <= start || window.start >= end) {
				continue
			}
			duration += Math.max(0, Math.min(window.stop, end) - Math.max(window.start, start))
		}

		const currentWindows = this.buffWindows[statusId].current
		if (currentWindows != null) {
			duration += Math.max(end - Math.max(currentWindows.start, start), 0)
		}

		return duration
	}

	// Manage buff windows
	private onGain(event: Events['statusApply']) {
		const status = this.data.getStatus(event.status)

		// Something is not right
		if (!status) { return }

		// Track the new window
		const tracker = this.buffWindows[status.id]

		// Don't open a new window if one's already going
		if (tracker.current) { return }

		tracker.current = {
			start: event.timestamp,
			casts: 0,
		}

		if (status.id === this.data.statuses.CIRCLE_OF_POWER.id) {
			this.castTimeIndex = this.castTime.setPercentageAdjustment('all', this.data.statuses.CIRCLE_OF_POWER.speedModifier, 'both')
		}

		// Add hooks for tracking cast events
		if (status.id === this.data.statuses.LEY_LINES.id && this.countCasts) {
			this.setEventHooks()
		}
	}

	private onPrepare(event: Events['prepare']) {
		if (this.actors.current.hasStatus(this.data.statuses.LEY_LINES.id)) {
			this.linesActionId = event.action
		}
		if (this.actors.current.hasStatus(this.data.statuses.CIRCLE_OF_POWER.id)) {
			this.circleActionId = event.action
		}
		this.maybeUnsetEventHooks()
	}

	private onAction(event: Events['action']) {
		// Only track GCDs
		const action = this.data.getAction(event.action)
		if (action == null || action.onGcd == null || !action.onGcd) {
			return
		}

		this.leyLinesStatuses.forEach((statusId) => {
			const window = this.getLastWindow(statusId)
			if (!window) { return }

			if (statusId === this.data.statuses.LEY_LINES.id && (this.actors.current.hasStatus(this.data.statuses.LEY_LINES.id) || this.linesActionId === event.action)) {
				window.casts++
			}
			if (statusId === this.data.statuses.CIRCLE_OF_POWER.id && (this.actors.current.hasStatus(this.data.statuses.CIRCLE_OF_POWER.id) || this.circleActionId === event.action)) {
				window.casts++
			}
		})

		this.linesActionId = null
		this.circleActionId = null
		this.maybeUnsetEventHooks()
	}

	private getLastWindow(statusId: Status['id']): LeyLinesWindow | undefined {
		const tracker = this.buffWindows[statusId]
		if (tracker.current) { return tracker.current }
		if (tracker.history.length === 0) { return undefined }
		return tracker.history[tracker.history.length - 1]
	}

	private onInterrupt(_event: Events['interrupt']) {
		this.linesActionId = null
		this.circleActionId = null
		this.maybeUnsetEventHooks()
	}

	private setEventHooks() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.preparesEventHook = this.addEventHook(playerFilter.type('prepare'), this.onPrepare)
		this.actionEventHook = this.addEventHook(playerFilter.type('action'), this.onAction)
		this.interruptEventHook = this.addEventHook(playerFilter.type('interrupt'), this.onInterrupt)
	}

	private maybeUnsetEventHooks() {
		if (this.actors.current.hasStatus(this.data.statuses.LEY_LINES.id)) { return }
		if (this.linesActionId || this.circleActionId) { return }

		this.unsetEventHooks()
	}

	private unsetEventHooks() {
		if (this.preparesEventHook) {
			this.removeEventHook(this.preparesEventHook)
			this.preparesEventHook = null
		}
		if (this.actionEventHook) {
			this.removeEventHook(this.actionEventHook)
			this.actionEventHook = null
		}
		if (this.interruptEventHook) {
			this.removeEventHook(this.interruptEventHook)
			this.interruptEventHook = null
		}
	}

	private onDrop(event: Events['statusRemove']) {
		this.stopAndSave(event.status, event.timestamp)
	}

	// We died, close windows
	private onDeath(event: Events['death']) {
		this.stopAndSave(this.data.statuses.LEY_LINES.id, event.timestamp)

		// also clear cast counting/tracking data/hooks
		this.linesActionId = null
		this.circleActionId = null
		this.unsetEventHooks()
	}

	// Finalise a buff window
	private stopAndSave(statusId: number, endTime: number = this.parser.currentEpochTimestamp) {
		const tracker = this.buffWindows[statusId]

		// Already closed, nothing to do here
		if (!tracker.current) { return }

		// Close the window
		tracker.current.stop = endTime
		tracker.history.push(tracker.current)
		tracker.current = undefined

		// Close dependency windows
		if (statusId === this.data.statuses.LEY_LINES.id) {
			this.stopAndSave(this.data.statuses.CIRCLE_OF_POWER.id, endTime)
		}

		if (statusId === this.data.statuses.CIRCLE_OF_POWER.id) {
			this.castTime.reset(this.castTimeIndex)
			this.castTimeIndex = null
		}
	}

	// A reminder of man's ability to generate electricity
	private dontMovePercent(power: number, lines: number) {
		if (lines === 0) { return 0 }
		return (power / lines) * 100
	}

	private onComplete() {
		// Current time will be end of fight so no need to pass it here
		this.stopAndSave(this.data.statuses.LEY_LINES.id)

		const fightStart = this.parser.pull.timestamp

		// For each buff, add it to timeline
		this.leyLinesStatuses.forEach(buff => {
			const status = this.data.getStatus(buff)
			if (!status) { return }

			const row = this.leyLinesRow.addRow(new SimpleRow({label: status.name}))

			this.buffWindows[buff].history.forEach(window => {
				if (!window.stop) { return }
				row.addItem(new StatusItem({
					status,
					start: window.start - fightStart,
					end: window.stop - fightStart,
				}))
			})
		})

		// Add the patch-appropriate checklist entry
		if (!this.countCasts) {
			// Get the total duration of CoP uptime and Ley Lines, so we can get the overall percentage uptime
			const copDuration = this.getStatusDurationInRange(this.data.statuses.CIRCLE_OF_POWER.id)
			const linesDuration = this.getStatusDurationInRange(this.data.statuses.LEY_LINES.id)

			this.checklist.add(new Rule({
				name: this.checklistName,
				description: this.checklistDescription,
				requirements: [
					new Requirement({
						name: <ActionLink {...this.data.actions.LEY_LINES} />,
						percent: this.dontMovePercent(copDuration, linesDuration),
					}),
				],
				//pretty random. Should be revised, maybe based on fights? 10% is ~ 1 GCD. So we allow that.
				target: 90,
			}))
		} else {
			const powerCasts = this.buffWindows[this.data.statuses.CIRCLE_OF_POWER.id].history.reduce((casts, window) => casts + window.casts, 0)
			const linesCasts = this.buffWindows[this.data.statuses.LEY_LINES.id].history.reduce((casts, window) => casts + window.casts, 0)

			this.checklist.add(new Rule({
				name: this.checklistName,
				description: this.checklistDescription,
				requirements: [
					new Requirement({
						name: <><ActionLink {...this.data.actions.LEY_LINES} /> casts affected by <ActionLink {...this.data.statuses.CIRCLE_OF_POWER} /></>,
						percent: this.dontMovePercent(powerCasts, linesCasts),
					}),
				],
			}))
		}
	}

	override output() {
		const fightEnd = this.parser.pull.timestamp + this.parser.pull.duration
		const showDuration = this.buffWindows[this.data.statuses.LEY_LINES.id].history.some(window => (window.stop || fightEnd) - window.start < this.data.statuses.LEY_LINES.duration - BUFF_DURATION_JITTER_MS)
		const maxPossible = Math.ceil(this.data.statuses.LEY_LINES.duration / (this.globalCooldown.getDuration() * this.data.statuses.CIRCLE_OF_POWER.speedModifier))
		return <>
			{
				// Only display the header message if we're counting cast events
				this.countCasts
					?<Message icon>
						<Icon name="info" />
						<Message.Content>
							<Trans id="blm.leylines.header.message">
								At your estimated GCD of <strong>{this.parser.formatDuration(this.globalCooldown.getDuration())}</strong>, you should be able to fit <strong>{maxPossible}</strong> casts into each <DataLink status="LEY_LINES" />.<br/><br/>
								If you missed casts, but all of them were affected by <DataLink status="CIRCLE_OF_POWER" />, you likely either didn't keep your GCD rolling, or weaved <DataLink showIcon={false} status="LEY_LINES" /> too early after the preceding GCD.<br/>
								If some casts were not affected by <DataLink showIcon={false} status="CIRCLE_OF_POWER" />, you should try to make use of <DataLink action="RETRACE" /> or move when you're using <DataLink showIcon={false} action="LEY_LINES" /> so you can get the full benefit of the buff.
							</Trans>
						</Message.Content>
					</Message>
					: <></>
			}
			<Table collapsing unstackable compact="very">
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell><Trans id="blm.leylines.timestamp-header">Timestamp</Trans></Table.HeaderCell>
						{
							// Show the uptime column header if we're in pre-7.2 uptime calculation mode
							!this.countCasts
								? <Table.HeaderCell><Trans id="blm.leylines.uptime-header">Uptime</Trans></Table.HeaderCell>
								: <></>
						}
						{
							// Show the cast count header if we're in 7.2+ cast count mode
							this.countCasts
								? <Table.HeaderCell><Trans id="blm.leylines.casts-header"><DataLink showIcon={false} status="CIRCLE_OF_POWER" /> casts</Trans></Table.HeaderCell>
								: <></>

						}
						{	// Show the buff duration and max possible casts headers if we're in 7.2+ cast count mode, and some window wasn't the full duration
							this.countCasts && showDuration
								? <>
									<Table.HeaderCell><Trans id="blm.leylines.duration-header"><StatusLink showIcon={false} {...this.data.statuses.LEY_LINES} /> duration</Trans></Table.HeaderCell>
									<Table.HeaderCell><Trans id="blm.leylines.possible-header">Max Possible Casts</Trans></Table.HeaderCell>
								</>
								: <></>
						}
						<Table.HeaderCell></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{this.buffWindows[this.data.statuses.LEY_LINES.id].history.map(leyLinesEvent => {
						const leylinesEventEnd = leyLinesEvent.stop || fightEnd

						// Find the CoPs that were inside this Ley Lines
						const thisCoPHistory = this.buffWindows[this.data.statuses.CIRCLE_OF_POWER.id].history.filter(cops => ((cops.start >= leyLinesEvent.start) && ((cops.stop || 0) <= leylinesEventEnd)))

						// For this set of CoPs, get the cast total
						const thisCoPUptime = thisCoPHistory.reduce((duration, cop) => duration + Math.max((cop.stop || 0) - cop.start, 0), 0)
						const thisCoPCasts = thisCoPHistory.reduce((count, cop) => count + cop.casts, 0)

						// Note that since we're getting the actual duration, rather than the expected duration,
						// technically we'll report fewer possible casts if you die halfway through...
						// However, since that'll get flagged as a morbid checklist item, that's probably ok.
						const leyLinesEventDuration = leylinesEventEnd - leyLinesEvent.start
						const thisPercent = this.dontMovePercent(thisCoPUptime, leyLinesEventDuration).toFixed(2)
						const castPercent = this.dontMovePercent(thisCoPCasts, leyLinesEvent.casts).toFixed(2)
						const possibleCasts = Math.ceil(leyLinesEventDuration / (this.globalCooldown.getDuration() * this.data.statuses.CIRCLE_OF_POWER.speedModifier))

						return <Table.Row key={leyLinesEvent.start}>
							<Table.Cell>{this.parser.formatEpochTimestamp(leyLinesEvent.start)}</Table.Cell>
							{
								!this.countCasts
									? <Table.Cell>{thisPercent}%</Table.Cell>
									: <></>
							}
							{
								this.countCasts
									? <Table.Cell>{thisCoPCasts}/{leyLinesEvent.casts} ({castPercent}%)</Table.Cell>
									: <></>
							}
							{
								this.countCasts && showDuration
									? <>
										<Table.Cell>{this.parser.formatDuration(leyLinesEventDuration)}</Table.Cell>
										<Table.Cell>{possibleCasts}</Table.Cell>
									</>
									: <></>
							}
							<Table.Cell>
								<Button onClick={() =>
									this.timeline.show(leyLinesEvent.start - this.parser.pull.timestamp, leylinesEventEnd - this.parser.pull.timestamp)}>
									<Trans id="blm.leylines.timelinelink-button">Jump to Timeline</Trans>
								</Button>
							</Table.Cell>
						</Table.Row>
					})}
				</Table.Body>
			</Table>
		</>
	}
}
