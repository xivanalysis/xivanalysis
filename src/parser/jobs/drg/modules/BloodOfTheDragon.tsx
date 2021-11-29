import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {StatusKey} from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import {Event} from 'legacyEvent'
import Module, {dependency} from 'parser/core/Module'
import BrokenLog from 'parser/core/modules/BrokenLog'
import Checklist from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'
import {Death} from 'parser/core/modules/Death'
import Downtime from 'parser/core/modules/Downtime'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Icon, Message, Table, Accordion, Button} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const DRAGON_DURATION_MILLIS = 30000
const LOTD_BUFF_DELAY_MIN = 30000
const LOTD_BUFF_DELAY_MAX = 60000

const MAX_EYES = 2
const EXPECTED_NASTRONDS_PER_WINDOW = 3

type DrgTrackedBuffs = 'LANCE_CHARGE' | 'RIGHT_EYE' | 'BATTLE_LITANY'

interface ActionWithBuffs {
	timestamp: number
	buffs: StatusKey[],
	action: ActionKey,
}

interface LifeWindow {
	start: number
	duration: number
	nastronds: ActionWithBuffs[]
	stardivers: ActionWithBuffs[]
	timeToNextBuff: Record<DrgTrackedBuffs, number>
	activeBuffs: StatusKey[],
	buffsInDelayWindow: Record<DrgTrackedBuffs, boolean>
	dtOverlapTime: number | null
	isLast: boolean
	shouldDelay: boolean
	showNoDelayNote: boolean
	missedSdBuff: boolean
}

interface LifeWindows {
	current?: LifeWindow
	history: LifeWindow[]
}

// EW notes:
// - looking at BuffWindow module to see if lotd tracking can be done through that. Not planning on doing that
//   port until basic EW support is in place
export default class BloodOfTheDragon extends Module {
	static override handle = 'bloodOfTheDragon'
	static override title = t('drg.blood.title')`Life of the Dragon`

	@dependency private brokenLog!: BrokenLog
	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private cooldowns!: Cooldowns
	@dependency private data!: Data
	@dependency private death!: Death
	@dependency private downtime!: Downtime
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	static override displayOrder = DISPLAY_ORDER.BLOOD_OF_THE_DRAGON_GAUGE

	// Null assumption, in case they precast. In all likelyhood, this will actually be incorrect, but there's no harm if
	// that's the case since BotD should be the very first weave in the fight and that'll reset the duration to 30s anyway.
	// Also, this way we don't count the first second of the fight as erroneous downtime.
	private lifeDuration = 0
	private lifeWindows: LifeWindows = {
		current: undefined,
		history: [],
	}
	private lastEventTime = this.parser.fight.start_time
	private eyes = 0
	private lostEyes = 0

	protected override init() {
		this.addEventHook('cast', {by: 'player', abilityId: this.data.actions.MIRAGE_DIVE.id}, this.onMirageDiveCast)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: this.data.actions.GEIRSKOGUL.id}, this.onGeirskogulCast)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: this.data.actions.NASTROND.id}, this.onNastrondCast)
		this.addEventHook('cast', {by: 'player', abilityId: this.data.actions.STARDIVER.id}, this.onStardiverCast)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('raise', {to: 'player'}, this.onRaise)
		this.addEventHook('complete', this.onComplete)
	}

	// duplicate code from other PRs
	private getActiveDrgBuffs(): StatusKey[] {
		const active: StatusKey[] = []

		if (this.combatants.selected.hasStatus(this.data.statuses.LANCE_CHARGE.id)) {
			active.push('LANCE_CHARGE')
		}

		if (this.combatants.selected.hasStatus(this.data.statuses.BATTLE_LITANY.id)) {
			active.push('BATTLE_LITANY')
		}

		if (
			this.combatants.selected.hasStatus(this.data.statuses.RIGHT_EYE.id) ||
			this.combatants.selected.hasStatus(this.data.statuses.RIGHT_EYE_SOLO.id)
		) {
			active.push('RIGHT_EYE')
		}

		return active
	}

	private createTimelineButton(timestamp: number) {
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp - this.parser.fight.start_time)}
			content={this.parser.formatTimestamp(timestamp)}
		/>
	}
	// end duplicate code

	private finishLifeWindow() {
		if (this.lifeWindows.current != null) {
			this.lifeWindows.history.push(this.lifeWindows.current)
			this.lifeWindows.current = undefined
		}
	}

	private updateGauge() {
		const elapsedTime = this.parser.currentTimestamp - this.lastEventTime
		if (this.lifeWindows.current != null) {
			this.lifeDuration -= elapsedTime
			if (this.lifeDuration <= 0) {
				// We're reverting out of Life
				this.finishLifeWindow()
				this.lifeDuration = 0
			}
		}

		this.lastEventTime = this.parser.currentTimestamp
	}

	onMirageDiveCast() {
		this.updateGauge()

		// You can accrue eyes in LotD too
		this.eyes++
		if (this.eyes > MAX_EYES) {
			this.lostEyes += this.eyes - MAX_EYES
			this.eyes = MAX_EYES
		}
	}

	onGeirskogulCast() {
		this.updateGauge()

		if (this.eyes === MAX_EYES) {
			// LotD tiiiiiime~
			this.lifeDuration = DRAGON_DURATION_MILLIS
			this.lifeWindows.current = {
				start: this.parser.currentTimestamp,
				duration: this.lifeDuration,
				nastronds: [],
				stardivers: [],
				timeToNextBuff: {
					'LANCE_CHARGE': this.cooldowns.remaining('LANCE_CHARGE'),
					'RIGHT_EYE': this.cooldowns.remaining('DRAGON_SIGHT'),
					'BATTLE_LITANY': this.cooldowns.remaining('BATTLE_LITANY'),
				},
				activeBuffs: this.getActiveDrgBuffs(),
				buffsInDelayWindow: {
					'LANCE_CHARGE': false,
					'RIGHT_EYE': false,
					'BATTLE_LITANY': false,
				},
				dtOverlapTime: null,
				isLast: false,
				shouldDelay: false,
				showNoDelayNote: false,
				missedSdBuff: false,
			}
			this.eyes = 0
		}
	}

	onNastrondCast(event: NormalisedDamageEvent) {
		if (this.lifeWindows.current == null) {
			// Nastrond outside of LotD - gentlemen, we have us a broken log
			this.brokenLog.trigger(this, 'no lotd nastrond', (
				<Trans id="drg.blood.trigger.no-lotd-nastrond">
					<ActionLink {...this.data.actions.NASTROND}/> was cast while Life of the Dragon was deemed inactive.
				</Trans>
			))
			return
		}

		if (
			this.lifeWindows.current &&
			!this.lifeWindows.current.nastronds.some(nastrond => nastrond.timestamp === event.timestamp)
		) {
			// Dedupe Nastrond casts, since that can occasionally happen
			this.lifeWindows.current.nastronds.push({
				timestamp: event.timestamp,
				buffs: this.getActiveDrgBuffs(),
				action: 'NASTROND',
			})
		}
	}

	onStardiverCast(event: CastEvent) {
		if (this.lifeWindows.current === null) {
			// Stardiver outside of LotD is also a sign of a broken log
			this.brokenLog.trigger(this, 'no lotd stardiver', (
				<Trans id="drg.blood.trigger.no-lotd-stardiver">
					<ActionLink {...this.data.actions.STARDIVER}/> was cast while Life of the Dragon was deemed inactive.
				</Trans>
			))
			return
		}

		if (
			this.lifeWindows.current &&
			!this.lifeWindows.current.stardivers.some(stardiver => stardiver.timestamp === event.timestamp)
		) {
			// Dedupe Stardiver casts, it's also AoE so it's probably going to happen on occasion too
			this.lifeWindows.current.stardivers.push({
				timestamp: event.timestamp,
				buffs: this.getActiveDrgBuffs(),
				action: 'STARDIVER',
			})
		}
	}

	onDeath() {
		// RIP
		this.updateGauge()
		this.lifeDuration = 0
		this.finishLifeWindow()

		// TODO: check if you lose eyes on death
		this.eyes = 0
	}

	onRaise(event: Event) {
		// So floor time doesn't count against BotD uptime
		this.lastEventTime = event.timestamp
	}

	intersectsDowntime(start: number) {
		const windows = this.downtime.getDowntimeWindows(this.parser.fflogsToEpoch(start))
			.map(window => ({
				start: this.parser.epochToFflogs(window.start),
				end: this.parser.epochToFflogs(window.end),
			}))
		const end = start + DRAGON_DURATION_MILLIS

		for (const dtWindow of windows) {
			if (dtWindow.start < end) {
				return dtWindow.start
			}
		}

		return null
	}

	analyzeLifeWindows() {
		for (const lifeWindow of this.lifeWindows.history) {
			// downtime overlap
			lifeWindow.dtOverlapTime = this.intersectsDowntime(Math.min(
				lifeWindow.start + this.data.actions.HIGH_JUMP.cooldown,
				this.parser.eventTimeOffset + this.parser.pull.duration,
			))

			// flag for last life window
			lifeWindow.isLast = lifeWindow.start + lifeWindow.duration > this.parser.fight.end_time

			// A window should be delayed if:
			// - there are no buffs off cooldown at any point in this window
			// - there are no upcoming downtime windows (checked here)
			// - there are buffs off cooldown in the theoretical delayed window
			// - there could be another window in 30s (end of fight check)
			let activeBuffsInWindow = lifeWindow.activeBuffs.length > 0
			const shouldBeDelayed = lifeWindow.activeBuffs.length === 0 && lifeWindow.dtOverlapTime === null && lifeWindow.start + LOTD_BUFF_DELAY_MAX < this.parser.fight.end_time

			let buffsExistInDelayWindow = false

			let buffKey: keyof typeof lifeWindow.timeToNextBuff
			for (buffKey in lifeWindow.timeToNextBuff) {
				// check if the time to the next buff falls within the next expected window
				lifeWindow.buffsInDelayWindow[buffKey] = lifeWindow.timeToNextBuff[buffKey] >= LOTD_BUFF_DELAY_MIN && lifeWindow.timeToNextBuff[buffKey] <= LOTD_BUFF_DELAY_MAX

				// this is just a running or (instead of a map later)
				buffsExistInDelayWindow = lifeWindow.buffsInDelayWindow[buffKey] || buffsExistInDelayWindow

				// ok now check if the buff comes off cd during the current window
				activeBuffsInWindow = lifeWindow.timeToNextBuff[buffKey] < lifeWindow.duration || activeBuffsInWindow
			}

			// ok now use all the flags to determine if a window should be delayed
			lifeWindow.shouldDelay = !activeBuffsInWindow && buffsExistInDelayWindow && shouldBeDelayed

			// if we're not delaying due to downtime in this fight, show an info note
			lifeWindow.showNoDelayNote = lifeWindow.dtOverlapTime !== null && !activeBuffsInWindow && buffsExistInDelayWindow

			// check the stardiver cast buffs
			// count a miss if the window could be delayed
			lifeWindow.missedSdBuff = (activeBuffsInWindow || lifeWindow.shouldDelay) && lifeWindow.stardivers.length === 1 && lifeWindow.stardivers[0].buffs.length === 0
		}
	}

	onComplete() {
		this.updateGauge()
		this.finishLifeWindow()
		this.analyzeLifeWindows()
		const noBuffSd = this.lifeWindows.history.filter(window => !window.isLast && window.missedSdBuff).length
		const noLifeSd = this.lifeWindows.history.filter(window => !window.isLast && window.stardivers.length === 0).length
		const noFullNsLife = this.lifeWindows.history.filter(window => !window.isLast && window.nastronds.length < EXPECTED_NASTRONDS_PER_WINDOW).length

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.MIRAGE_DIVE.icon,
			content: <Trans id="drg.blood.suggestions.eyes.content">
				Avoid using <ActionLink {...this.data.actions.MIRAGE_DIVE}/> when you already have {MAX_EYES} Eyes. Wasting Eyes will delay your Life of the Dragon windows and potentially cost you a lot of DPS.
			</Trans>,
			value: this.lostEyes,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			why: <Trans id="drg.blood.suggestions.eyes.why">
				You used Mirage Dive <Plural value={this.lostEyes} one="# time" other="# times"/> when you already had {MAX_EYES} Eyes.
			</Trans>,
		}))

		// each window should have a stardiver
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.STARDIVER.icon,
			content: <Trans id="drg.suggestions.stardiver.content">
				Each Life of the Dragon window should contain 1 <ActionLink {...this.data.actions.STARDIVER}/> use.
			</Trans>,
			value: noLifeSd,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			why: <Trans id="drg.suggetions.stardiver.why">{noLifeSd} of your Life of the Dragon windows were missing a <ActionLink {...this.data.actions.STARDIVER}/> use.</Trans>,
		}))

		// each window should have 3 nastronds
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.NASTROND.icon,
			content: <Trans id="drg.suggestions.nastrond.content">Each Life of the Dragon window should contain 3 <ActionLink {...this.data.actions.NASTROND}/> uses.</Trans>,
			value: noFullNsLife,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			why: <Trans id="drg.suggestions.nastrond.why">{noFullNsLife} of your Life of the Dragon windows were missing one or more <ActionLink {...this.data.actions.NASTROND}/> uses.</Trans>,
		}))

		// this suggestion only counts places where a stardiver could be buffed
		// if a window cannot be delayed and has no buffs, it doesn't count
		if (noBuffSd > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.STARDIVER.icon,
				content: <Trans id="drg.blood.suggestions.buffed-stardiver">
					Try to ensure that <ActionLink {...this.data.actions.STARDIVER} /> always lands while at least one of <ActionLink {...this.data.actions.LANCE_CHARGE} />, <ActionLink {...this.data.actions.DRAGON_SIGHT} />, or <ActionLink {...this.data.actions.BATTLE_LITANY} /> is active. Depending on the fight specifics, this may not always be possible. See the Timeline module below for details.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="drg.blood.suggestions.buffsed-stardiver.why">
					When <ActionLink {...this.data.actions.STARDIVER} /> could have been buffed, you used it <Plural value={noBuffSd} one="# time" other="# times" /> without a buff.
				</Trans>,
			}))
		}
	}

	private windowTable(lifeWindow: LifeWindow) {
		const casts = lifeWindow.nastronds.concat(lifeWindow.stardivers)
		casts.sort((a, b) => { return a.timestamp - b.timestamp })

		const rows = casts.map(cast => {
			const buffs = cast.buffs.map(id => {
				return <StatusLink key={id} showName={false} iconSize="35px" {...this.data.statuses[id]} />
			})

			return <Table.Row key={cast.timestamp} warning={cast.action === 'STARDIVER' && lifeWindow.missedSdBuff}>
				<Table.Cell>{this.createTimelineButton(cast.timestamp)}</Table.Cell>
				<Table.Cell><ActionLink {...this.data.actions[cast.action]} /></Table.Cell>
				<Table.Cell>{buffs}</Table.Cell>
			</Table.Row>
		})

		const delayBuffs = Object.entries(lifeWindow.buffsInDelayWindow)
			.filter(([_, inWindow]) => {
				return inWindow
			})
			.map(([buffKey, _], idx) => {
				return <Message.Item key={idx}><Trans id="drg.blood.delay-buff"><ActionLink {...this.data.statuses[buffKey as StatusKey]} /> in {this.parser.formatDuration(lifeWindow.timeToNextBuff[buffKey as DrgTrackedBuffs])}</Trans></Message.Item>
			})

		return <Fragment>
			{lifeWindow.isLast && (
				<Message info>
					<p><Trans id="drg.blood.final-window-explain">This window would last past the end of the fight and does not count against missing casts of <ActionLink {...this.data.actions.NASTROND} /> and <ActionLink {...this.data.actions.STARDIVER} /> in the Suggestions. The warnings will still be shown for completeness.</Trans></p>
				</Message>
			)}
			{lifeWindow.stardivers.length === 0 && (
				<Message error>
					<p><Icon name="warning sign"/> <Trans id="drg.blood.no-stardiver-explain">You did not use <ActionLink {...this.data.actions.STARDIVER}/> during this window.</Trans></p>
				</Message>
			)}
			{lifeWindow.nastronds.length < EXPECTED_NASTRONDS_PER_WINDOW && (
				<Message error>
					<p><Icon name="warning sign"/> <Trans id="drg.blood.no-nastrond-explain">You missed one or more uses of <ActionLink {...this.data.actions.NASTROND}/> during this window.</Trans></p>
				</Message>
			)}
			{lifeWindow.missedSdBuff && (
				<Message warning>
					<p><Trans id="drg.blood.no-buff-stardiver-explain">You did not use <ActionLink {...this.data.actions.STARDIVER}/> while buffed during this window.</Trans></p>
				</Message>
			)}
			{lifeWindow.shouldDelay && (
				<Message warning>
					<p><Trans id="drg.blood.delay-explain"> If possible, Life of the Dragon windows should line up with your personal buffs. This window could be delayed to line up with:
					</Trans></p>
					<Message.List>
						{delayBuffs}
					</Message.List>
				</Message>
			)}
			{lifeWindow.showNoDelayNote && (
				<Message info>
					<p><Trans id="drg.blood.no-delay-explain">This window cannot be delayed due to downtime occurring at {this.parser.formatTimestamp(lifeWindow.dtOverlapTime ?? 0)}. This window would otherwise be delayed for better buff alignment.</Trans></p>
				</Message>
			)}
			<Table>
				<Table.Header>
					<Table.Row key="header">
						<Table.HeaderCell><Trans id="drg.blood.table.time">Time</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="drg.blood.table.action">Action</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="drg.blood.table.statuses">Personal Buffs</Trans></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				{rows}
			</Table>
		</Fragment>
	}

	formatWindowTitle(lifeWindow: LifeWindow) {
		// flag the row if we see either:
		// - a non-buffed stardiver in any window, except the windows that cannot be delayed
		// - a window that could be delayed but wasn't
		const windowWarning = lifeWindow.shouldDelay || lifeWindow.missedSdBuff
		const windowError = lifeWindow.stardivers.length === 0 || lifeWindow.nastronds.length < EXPECTED_NASTRONDS_PER_WINDOW
		const title = <>{this.parser.formatTimestamp(lifeWindow.start)} <span> - </span> <Trans id="drg.blood.windows.hits"><Plural value={lifeWindow.nastronds.length} one="# Nastrond" other="# Nastronds" />, <Plural value={lifeWindow.stardivers.length} one="# Stardiver" other="# Stardivers" /></Trans></>

		if (windowError) {
			return <span className="text-error">{title}</span>
		}

		if (windowWarning) {
			return <span className="text-warning">{title}</span>
		}

		return title
	}

	override output() {
		if (this.lifeWindows.history.length > 0) {
			const lotdPanels = this.lifeWindows.history.map(window => {
				return {
					title: {
						key: `title-${window.start}`,
						content: this.formatWindowTitle(window),
					},
					content: {
						key: `content-${window.start}`,
						content: this.windowTable(window),
					},
				}
			})

			return <Fragment>
				<Accordion exclusive={false} panels={lotdPanels} styled fluid />
			</Fragment>
		}

		// This should really never happen but if they didn't go into LotD once, we shouldn't bother showing the section
		return false
	}
}
