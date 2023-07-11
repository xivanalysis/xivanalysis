import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import {RotationTable, RotationTableEntry} from 'components/ui/RotationTable'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// Teechnicaly it's 20% but at 18% HP the HP next regen tick will move you past
// the window, so give it a bit of a fuzz
const REVENGE_BLAST_PERCENT = 0.20
const REVENGE_BLAST_WINDOW_PERCENT = 0.18
const REVENGE_BLAST_MINIMUM_WINDOW_MS = 5000

const REVENGE_BLAST_CAST_TIME = 2000
const SLIDECAST_OFFSET = 500

// Tiered suggestion severities
const REVENGE_SEVERITY = {
	WINDOW_MISSED: {
		1: SEVERITY.MINOR,
		2: SEVERITY.MINOR,
		3: SEVERITY.MAJOR,
	},
	CAST_OUT_OF_WINDOW: {
		1: SEVERITY.MAJOR,
	},
	UNWHISTLED_OPENING_REVENGE_BLAST: {
		1: SEVERITY.MINOR,
	},
}

interface RevengeBlastWindow {
	events: Array<Events['action']>,
	hadWhistle: boolean,
	hadRevengeBlast: boolean,
}

export class RevengeBlast extends Analyser {
	static override handle = 'revengeblast'
	static override title = t('blu.revenge_blast.title')`Revenge Blast Windows`
	static override displayOrder = DISPLAY_ORDER.REVENGE_BLAST

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private downtime!: Downtime
	@dependency private gcd!: GlobalCooldown

	private badRevengeBlasts = 0
	private inRevengeBlastWindow = false
	private revengeBlastWindows = new History<RevengeBlastWindow>(
		() => ({
			events: [],
			hadWhistle: false,
			hadRevengeBlast: false,
		})
	)
	private actionHook?: EventHook<Events['action']>

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('action').action(this.data.actions.REVENGE_BLAST.id), this.onRevengeBlast)
		this.addEventHook(playerFilter.type(oneOf(['heal', 'damage'])), this.onActorUpdate)
		this.addEventHook(filter<Event>().type('actorUpdate').actor(this.parser.actor.id), this.onActorUpdate)
		this.addEventHook({
			type: 'death',
			actor: this.parser.actor.id,
		}, this.onActorUpdate)

		this.addEventHook('complete', this.onComplete)
	}

	private onActorUpdate(event: Event) {
		const revengeBlastThreshold = this.actors.current.hp.maximum * REVENGE_BLAST_WINDOW_PERCENT

		// TODO: check if we are in a downtime window

		if ((this.actors.current.hp.current > 0) && (this.actors.current.hp.current < revengeBlastThreshold)) {
			if (this.inRevengeBlastWindow) { return }
			this.inRevengeBlastWindow = true
			this.revengeBlastWindows.openNew(event.timestamp)
			if (this.actionHook == null) {
				this.actionHook = this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action'), this.onRevengeBlastWindow)
			}
		} else {
			if (!this.inRevengeBlastWindow) { return }
			this.inRevengeBlastWindow = false
			this.revengeBlastWindows.closeCurrent(event.timestamp)
			if (this.actionHook != null) {
				this.removeEventHook(this.actionHook)
				this.actionHook = undefined
			}
		}
	}

	private onRevengeBlastWindow(event: Events['action']) {
		this.revengeBlastWindows.doIfOpen(current => {
			if (!current.hadRevengeBlast && event.action === this.data.actions.REVENGE_BLAST.id) {
				if (this.actors.current.hasStatus(this.data.statuses.WHISTLE.id)) {
					current.hadWhistle = true
				}
				current.hadRevengeBlast = true
			}
			current.events.push(event)
		})
	}

	private onRevengeBlast() {
		const revengeBlastThreshold = this.actors.current.hp.maximum * REVENGE_BLAST_PERCENT
		if (this.actors.current.hp.current > revengeBlastThreshold) {
			this.badRevengeBlasts++
		}
	}

	private onComplete() {
		this.revengeBlastWindows.closeCurrent(this.parser.pull.timestamp + this.parser.pull.duration)

		// Revenge Blasts that happened above the HP threshold.
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REVENGE_BLAST.icon,
			content: <Trans id="blu.revenge_blast.bad.content">
				Only use <DataLink action="REVENGE_BLAST" /> if your HP will be below 20% by the time the slidecast window starts.
			</Trans>,
			tiers: REVENGE_SEVERITY.CAST_OUT_OF_WINDOW,
			value: this.badRevengeBlasts,
			why: <Trans id="blu.revenge_blast.bad.why">
				<Plural value={this.badRevengeBlasts} one="# Revenge Blast cast" other="# Revenge Blast casts" /> happened when above 20% HP
			</Trans>,
		}))

		// If you know a Revenge Blast window is coming, using Whistle first is a DPS gain.
		const unwhistledWindows: number = this.revengeBlastWindows.entries
			.filter(revengeWindow => revengeWindow.data.hadRevengeBlast && !revengeWindow.data.hadWhistle)
			.length
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.REVENGE_BLAST.icon,
			content: <Trans id="blu.revenge_blast.unwhistled.content">
				If it won't drop a <DataLink action="REVENGE_BLAST" /> cast, you should cast <DataLink action="WHISTLE" /> before entering a <DataLink action="REVENGE_BLAST" showIcon={false} /> window for a DPS gain over using your filler.
			</Trans>,
			tiers: REVENGE_SEVERITY.UNWHISTLED_OPENING_REVENGE_BLAST,
			value: unwhistledWindows,
			why: <Trans id="blu.revenge_blast.unwhistled.why">
				<Plural value={unwhistledWindows ?? 0} one="# Revenge Blast window" other="# Revenge Blast windows" /> did not have the <DataLink action="WHISTLE" showIcon={false} /> buff.
			</Trans>,
		}))
	}

	override output() {
		if (this.revengeBlastWindows.entries.length === 0) { return undefined }

		const gcdHeader = {
			header: <Trans id="blu.revenge_blast.rotation-table.header.blast-count">Revenge Blasts</Trans>,
			accessor: 'gcds',
		}

		const gcd = this.gcd.getDuration() / 1000
		const revengeBlastID = this.data.actions.REVENGE_BLAST.id
		const dat = this.data
		const downtime = this.downtime
		const rotationData: RotationTableEntry[] = []
		this.revengeBlastWindows.entries
			.filter(revengeWindow => ((revengeWindow.end ?? revengeWindow.start) - revengeWindow.start) > REVENGE_BLAST_MINIMUM_WINDOW_MS)
			.forEach(revengeWindow => {
				const revengeStart = revengeWindow.start - this.parser.pull.timestamp - REVENGE_BLAST_CAST_TIME + SLIDECAST_OFFSET
				const revengeEnd = (revengeWindow.end ?? revengeWindow.start) - this.parser.pull.timestamp - REVENGE_BLAST_CAST_TIME + SLIDECAST_OFFSET
				const forcedDowntime = downtime.getDowntime(
					revengeWindow.start,
					revengeWindow.end ?? revengeWindow.start,
				)
				// TODO: this is a cop-out. Dealing with downtime is hard.
				if (forcedDowntime > REVENGE_BLAST_MINIMUM_WINDOW_MS) { return }

				const deltaMs = revengeEnd - revengeStart - forcedDowntime
				if (deltaMs < REVENGE_BLAST_MINIMUM_WINDOW_MS) { return }

				const expectedGCDs = Math.floor(deltaMs / 1000 / gcd)
				const tableEntry: RotationTableEntry = {
					start: revengeStart,
					end: revengeEnd,
					targetsData: {
						gcds: {
							actual: revengeWindow.data.events.filter(e => dat.getAction(e.action)?.id === revengeBlastID).length,
							expected: expectedGCDs,
						},
					},
					rotation: revengeWindow.data.events.map(event => ({action: event.action})),
				}
				rotationData.push(tableEntry)
			})

		if (rotationData.length === 0) { return }

		return <Fragment>
			<Message>
				<Trans id="blu.revenge_blast.table.message">Finding windows to safely use <ActionLink action="REVENGE_BLAST"/> is always a good idea. Even small windows of two GCDs can be attractive -- If you fumble the timing and the second cast only does 50 potency, it is still a DPS gain over casting a filler GCD twice.</Trans>
			</Message>
			<RotationTable
				targets={[gcdHeader]}
				data={rotationData}
				onGoto={this.timeline.show}
			/>
		</Fragment>
	}
}

