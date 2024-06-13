import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import DISPLAY_ORDER from 'parser/jobs/gnb/modules/DISPLAY_ORDER'
import React, {Fragment} from 'react'
import {Button, Message, Table} from 'semantic-ui-react'

const MAX_TICKS = 10  // Sonic Break is 30s

class SonicBreakApplication {
	start: number
	end?: number
	totalTicks: number
	isMissingTicks: boolean = false

	constructor(start: number) {
		this.start = start
		this.totalTicks = 0
	}
}

export class SonicBreak extends Analyser {
	static override handle = 'Sonic Break'
	static override title = t('gnb.sonic-break.title')`Sonic Break`
	static override displayOrder = DISPLAY_ORDER.SONIC_BREAK

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private SonicBreakApplications: SonicBreakApplication[] = []

	private get lastSonicBreakApplication(): SonicBreakApplication | undefined {
		return _.last(this.SonicBreakApplications)
	}

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.SONIC_BREAK.id), this.onDotApply)
		this.addEventHook(playerFilter.type('damage'), this.onDotDamage)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.SONIC_BREAK.id), this.onDotRemove)
		this.addEventHook('complete', this.onComplete)

	}

	private onDotApply(event: Events['statusApply']) {
		const lastSonicBreak = this.lastSonicBreakApplication

		//If below is true, we broke it and the last window was not closed properly.
		if (lastSonicBreak != null && lastSonicBreak.end == null) {
			lastSonicBreak.end = (lastSonicBreak.start + this.data.statuses.SONIC_BREAK.duration * 1000)
		}

		this.breakMaker(event)

	}

	private onDotDamage(event: Events['damage']) {
		if (event.cause.type === 'status') {
			if (event.targets.find(e => e.amount !== 0) && event.cause.status === this.data.statuses.SONIC_BREAK.id) { //Dot did damage, increment.
				this.breakUpdater(event)
			}
		}
	}

	private onDotRemove(event: Events['statusRemove']) {
		this.breakEnder(event)
	}

	private breakMaker(event: Event) : void {
		const sonicBreakWindow = new SonicBreakApplication(event.timestamp)
		this.SonicBreakApplications.push(sonicBreakWindow)
	}

	private breakUpdater(event: Event) : void {
		const lastSonicBreak = this.lastSonicBreakApplication

		//We missed the break maker somehow and now we need to make it.
		if (lastSonicBreak == null || lastSonicBreak.end != null) {
			this.breakMaker(event)
		}

		if (lastSonicBreak != null && lastSonicBreak.end == null) {
			lastSonicBreak.totalTicks++
		}
	}

	private breakEnder(event: Event) : void {
		const lastSonicBreak = this.lastSonicBreakApplication

		if (lastSonicBreak != null && lastSonicBreak.end == null) {

			lastSonicBreak.end = event.timestamp

			if (lastSonicBreak.totalTicks < MAX_TICKS) {
				lastSonicBreak.isMissingTicks = true
			}
		}
	}

	private onComplete() {
		const badSonicBreaks = this.SonicBreakApplications.filter(sonicBreak => sonicBreak.isMissingTicks)
		if (badSonicBreaks.length > 0) {
			const missedTicks = badSonicBreaks.reduce((acc, val) => acc + (MAX_TICKS - val.totalTicks), 0)
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.SONIC_BREAK.icon,
				content: <Trans id="gnb.sonic-break.suggestions.missing-ticks.content">
					One or more of your <DataLink action = "SONIC_BREAK"/> dots had ticks that did not deal damage. </Trans>,
				tiers: {
					1: SEVERITY.MINOR,
					5: SEVERITY.MEDIUM,
					10: SEVERITY.MAJOR,

				},
				value: missedTicks,
				why: <Trans id = "gnb.sonic-break.suggestions.missing-ticks.why"> You wasted {missedTicks} ticks of <DataLink action = "SONIC_BREAK"/> </Trans>,
			},
			))
		}
	}

	override output() {
		if (this.SonicBreakApplications.filter(sonicBreak => sonicBreak.isMissingTicks).length === 0) { return }

		const missedTickWindows = this.SonicBreakApplications.filter(sonicBreak => sonicBreak.isMissingTicks)

		const tickTable = <Table collapsing unstackable compact="very">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="gnb.sonic-break.ticktable">Timestamp</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="gnb.sonic-break.ticktable.drift-header">Missing Ticks</Trans></Table.HeaderCell>
					<Table.HeaderCell></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{missedTickWindows.map(window => {
					return <Table.Row key={window.start}>
						<Table.Cell>{this.parser.formatEpochTimestamp(window.start)}</Table.Cell>
						<Table.Cell>
							<Trans id="sonic-break.tick-issue">
								<DataLink action = "SONIC_BREAK"/> had {MAX_TICKS - window.totalTicks} ticks deal no damage.
							</Trans>
						</Table.Cell>
						<Table.Cell>
							<Button onClick={() => {
								if (window.end) {
									this.timeline.show(window.start - this.parser.pull.timestamp, window.end - this.parser.pull.timestamp)
								}
							}}>
								<Trans id="gnb.sonic-break.ticktable.timelinelink-button">Jump to Timeline</Trans>
							</Button>
						</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>

		return <Fragment>
			<Message>
				<Trans id="gnb.sonic-break.accordion.message">
					<DataLink action = "SONIC_BREAK"/> is a {this.data.statuses.SONIC_BREAK.duration / 1000} second dot that should tick {MAX_TICKS} times for damage, if you are finding that the target is going invulnerable, consider moving it forward in your <DataLink action = "NO_MERCY"/> windows.
				</Trans>
			</Message>
			{tickTable}
		</Fragment>
	}
}
