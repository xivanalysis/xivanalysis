import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import {Icon, Message, Table, Accordion, Button} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {getDataBy} from 'data'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const DRAGON_MAX_DURATION_MILLIS = 30000
const DRAGON_DEFAULT_DURATION_MILLIS = 30000
const BLOOD_EXTENSION_MILLIS = 10000
const LOTD_BUFF_DELAY_MIN = 30000
const LOTD_BUFF_DELAY_MAX = 60000

const MAX_EYES = 2
const EXPECTED_NASTRONDS_PER_WINDOW = 3

export default class BloodOfTheDragon extends Module {
	static handle = 'bloodOfTheDragon'
	static title = t('drg.blood.title')`Life of the Dragon`
	static dependencies = [
		'brokenLog',
		'checklist',
		'combatants',
		'cooldowns',
		'death',
		'downtime',
		'suggestions',
		'timeline',
	]
	static displayOrder = DISPLAY_ORDER.BLOOD_OF_THE_DRAGON_GAUGE

	// Null assumption, in case they precast. In all likelyhood, this will actually be incorrect, but there's no harm if
	// that's the case since BotD should be the very first weave in the fight and that'll reset the duration to 30s anyway.
	// Also, this way we don't count the first second of the fight as erroneous downtime.
	_bloodDuration = DRAGON_DEFAULT_DURATION_MILLIS
	_bloodDowntime = 0
	_lifeDuration = 0
	_lifeWindows = {
		current: null,
		history: [],
	}
	_lastEventTime = this.parser.fight.start_time
	_eyes = 0
	_lostEyes = 0

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.FANG_AND_CLAW.id, ACTIONS.WHEELING_THRUST.id]}, this._onExtenderCast)
		this.addEventHook('combo', {by: 'player', abilityId: ACTIONS.SONIC_THRUST.id}, this._onExtenderCast)
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.BLOOD_OF_THE_DRAGON.id}, this._onBloodCast)
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.MIRAGE_DIVE.id}, this._onMirageDiveCast)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: ACTIONS.GEIRSKOGUL.id}, this._onGeirskogulCast)
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: ACTIONS.NASTROND.id}, this._onNastrondCast)
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.STARDIVER.id}, this._onStardiverCast)
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('raise', {to: 'player'}, this._onRaise)
		this.addEventHook('complete', this._onComplete)
	}

	// duplicate code from other PRs
	getActiveDrgBuffs() {
		const active = []

		if (this.combatants.selected.hasStatus(STATUSES.LANCE_CHARGE.id)) {
			active.push(STATUSES.LANCE_CHARGE.id)
		}

		if (this.combatants.selected.hasStatus(STATUSES.BATTLE_LITANY.id)) {
			active.push(STATUSES.BATTLE_LITANY.id)
		}

		if (this.combatants.selected.hasStatus(STATUSES.RIGHT_EYE.id) || this.combatants.selected.hasStatus(STATUSES.RIGHT_EYE_SOLO.id)) {
			active.push(STATUSES.RIGHT_EYE.id)
		}

		return active
	}

	createTimelineButton(timestamp) {
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

	_finishLifeWindow() {
		if (this._lifeWindows.current !== null) {
			this._lifeWindows.history.push(this._lifeWindows.current)
			this._lifeWindows.current = null
		}
	}

	_updateGauge() {
		const elapsedTime = this.parser.currentTimestamp - this._lastEventTime
		if (this._lifeWindows.current !== null) {
			this._lifeDuration -= elapsedTime
			if (this._lifeDuration <= 0) {
				// We're reverting out of Life
				this._finishLifeWindow()
				this._bloodDuration = DRAGON_DEFAULT_DURATION_MILLIS + this._lifeDuration // Actually subtraction
				this._lifeDuration = 0
			}
		} else {
			this._bloodDuration -= elapsedTime
		}

		if (this._bloodDuration <= 0) {
			// Blood fell off; reset everything
			this._bloodDowntime -= this._bloodDuration // Actually addition
			this._bloodDuration = 0
			this._eyes = 0
		}

		this._lastEventTime = this.parser.currentTimestamp
	}

	_onExtenderCast() {
		this._updateGauge()
		if (this._lifeWindows.current === null && this._bloodDuration > 0) {
			// If we're in regular Blood, increase the duration
			this._bloodDuration = Math.min(this._bloodDuration + BLOOD_EXTENSION_MILLIS, DRAGON_MAX_DURATION_MILLIS)
		}
	}

	_onBloodCast() {
		this._updateGauge()
		this._bloodDuration = DRAGON_DEFAULT_DURATION_MILLIS
	}

	_onMirageDiveCast() {
		this._updateGauge()
		if (this._lifeWindows.current !== null || this._bloodDuration > 0) {
			// You can accrue eyes in LotD too
			this._eyes++
			if (this._eyes > MAX_EYES) {
				this._lostEyes += this._eyes - MAX_EYES
				this._eyes = MAX_EYES
			}
		}
	}

	_onGeirskogulCast() {
		this._updateGauge()

		if (this._eyes === MAX_EYES) {
			// LotD tiiiiiime~
			this._lifeDuration = DRAGON_DEFAULT_DURATION_MILLIS
			this._lifeWindows.current = {
				start: this.parser.currentTimestamp,
				duration: this._lifeDuration,
				nastronds: [],
				stardivers: [],
				timeToNextBuff: {
					[ACTIONS.LANCE_CHARGE.id]: this.cooldowns.getCooldownRemaining(ACTIONS.LANCE_CHARGE.id),
					[ACTIONS.DRAGON_SIGHT.id]: this.cooldowns.getCooldownRemaining(ACTIONS.DRAGON_SIGHT.id),
					[ACTIONS.BATTLE_LITANY.id]: this.cooldowns.getCooldownRemaining(ACTIONS.BATTLE_LITANY.id),
				},
				activeBuffs: this.getActiveDrgBuffs(),
			}
			this._eyes = 0
		}
	}

	_onNastrondCast(event) {
		if (this._lifeWindows.current === null) {
			// Nastrond outside of LotD - gentlemen, we have us a broken log
			this.brokenLog.trigger(this, 'no lotd nastrond', (
				<Trans id="drg.blood.trigger.no-lotd-nastrond">
					<ActionLink {...ACTIONS.NASTROND}/> was cast while Life of the Dragon was deemed inactive.
				</Trans>
			))
			return
		}

		if (!this._lifeWindows.current.nastronds.some(nastrond => nastrond.timestamp === event.timestamp)) {
			// Dedupe Nastrond casts, since that can occasionally happen
			this._lifeWindows.current.nastronds.push({
				timestamp: event.timestamp,
				buffs: this.getActiveDrgBuffs(),
				action: ACTIONS.NASTROND,
			})
		}
	}

	_onStardiverCast(event) {
		if (this._lifeWindows.current === null) {
			// Stardiver outside of LotD is also a sign of a broken log
			this.brokenLog.trigger(this, 'no lotd stardiver', (
				<Trans id="drg.blood.trigger.no-lotd-stardiver">
					<ActionLink {...ACTIONS.STARDIVER}/> was cast while Life of the Dragon was deemed inactive.
				</Trans>
			))
			return
		}

		if (!this._lifeWindows.current.stardivers.some(stardiver => stardiver.timestamp === event.timestamp)) {
			// Dedupe Stardiver casts, it's also AoE so it's probably going to happen on occasion too
			this._lifeWindows.current.stardivers.push({
				timestamp: event.timestamp,
				buffs: this.getActiveDrgBuffs(),
				action: ACTIONS.STARDIVER,
			})
		}
	}

	_onDeath() {
		// RIP
		this._bloodDuration = 0
		this._lifeDuration = 0
		this._finishLifeWindow()
		this._eyes = 0
	}

	_onRaise(event) {
		// So floor time doesn't count against BotD uptime
		this._lastEvent = event.timestamp
	}

	_intersectsDowntime(start) {
		const windows = this.downtime.getDowntimeWindows(start)
		const end = start + DRAGON_DEFAULT_DURATION_MILLIS

		for (const dtWindow of windows) {
			if (dtWindow.start < end) {
				return dtWindow.start
			}
		}

		return null
	}

	_analyzeLifeWindows() {
		for (const lifeWindow of this._lifeWindows.history) {
			// determine if it could be delayed
			lifeWindow.buffsInDelayWindow = {}

			lifeWindow.dtOverlapTime = this._intersectsDowntime((lifeWindow.start + ACTIONS.HIGH_JUMP.cooldown * 1000))

			// A window should be delayed if:
			// - there are no buffs off cooldown at any point in this window
			// - there are no upcoming downtime windows (checked here)
			// - there are buffs off cooldown in the theoretical delayed window
			let activeBuffsInWindow = lifeWindow.activeBuffs.length > 0
			const shouldBeDelayed = lifeWindow.activeBuffs.length === 0 && lifeWindow.dtOverlapTime === null

			let buffsExistInDelayWindow = false

			for (const id in lifeWindow.timeToNextBuff) {
				// check if the time to the next buff falls within the next expected window
				lifeWindow.buffsInDelayWindow[id] = lifeWindow.timeToNextBuff[id] >= LOTD_BUFF_DELAY_MIN && lifeWindow.timeToNextBuff[id] <= LOTD_BUFF_DELAY_MAX

				// this is just a running or (instead of a map later)
				buffsExistInDelayWindow = lifeWindow.buffsInDelayWindow[id] || buffsExistInDelayWindow

				// ok now check if the buff comes off cd during the current window
				activeBuffsInWindow = lifeWindow.timeToNextBuff[id] < lifeWindow.duration || activeBuffsInWindow
			}

			// ok now use all the flags to determine if a window should be delayed
			lifeWindow.shouldDelay = !activeBuffsInWindow && buffsExistInDelayWindow && shouldBeDelayed

			// if we're not delaying due to downtime in this fight, show an info note
			lifeWindow.showNoDelayNote = lifeWindow.dtOverlapTime !== null && !activeBuffsInWindow && buffsExistInDelayWindow

			// check the stardiver cast buffs
			// count a miss if the window could be delayed
			lifeWindow.missedSdBuff = (activeBuffsInWindow || lifeWindow.shouldDelay) && lifeWindow.stardivers.length === 1 && lifeWindow.stardivers[0].buffs.length === 0

			lifeWindow.isLast = lifeWindow.start + lifeWindow.duration > this.parser.fight.end_time
		}
	}

	_onComplete() {
		this._finishLifeWindow()
		this._analyzeLifeWindows()
		const duration = this.parser.currentDuration - this.death.deadTime
		const uptime = ((duration - this._bloodDowntime) / duration) * 100
		const noBuffSd = this._lifeWindows.history.filter(window => !window.isLast && window.missedSdBuff).length
		const noLifeSd = this._lifeWindows.history.filter(window => !window.isLast && window.stardivers.length === 0).length
		const noFullNsLife = this._lifeWindows.history.filter(window => !window.isLast && window.nastronds.length < EXPECTED_NASTRONDS_PER_WINDOW).length

		this.checklist.add(new Rule({
			name: <Trans id="drg.blood.checklist.name">Keep Blood of the Dragon up</Trans>,
			description: <Fragment>
				<Trans id="drg.blood.checklist.description"><ActionLink {...ACTIONS.BLOOD_OF_THE_DRAGON}/> is at the heart of the DRG rotation and should be kept up at all times. Without it, your jumps are weakened and you can't use <ActionLink {...ACTIONS.NASTROND}/>.</Trans>
				<Message warning icon>
					<Icon name="warning sign"/>
					<Message.Content>
						<Trans id="drg.blood.checklist.description.warning">As Blood of the Dragon is now a gauge instead of a buff, please bear in mind that the numbers here and in the Life of the Dragon windows below are simulated. As such, it may not line up perfectly with reality.</Trans>
					</Message.Content>
				</Message>
			</Fragment>,
			displayOrder: DISPLAY_ORDER.BLOOD_OF_THE_DRAGON_CHECKLIST,
			requirements: [
				new Requirement({
					name: <Trans id="drg.blood.checklist.requirement.name"><ActionLink {...ACTIONS.BLOOD_OF_THE_DRAGON}/> uptime</Trans>,
					percent: () => uptime,
				}),
			],
			target: 98,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MIRAGE_DIVE.icon,
			content: <Trans id="drg.blood.suggestions.eyes.content">
				Avoid using <ActionLink {...ACTIONS.MIRAGE_DIVE}/> when you already have {MAX_EYES} Eyes. Wasting Eyes will delay your Life of the Dragon windows and potentially cost you a lot of DPS.
			</Trans>,
			value: this._lostEyes,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			why: <Trans id="drg.blood.suggestions.eyes.why">
				You used Mirage Dive <Plural value={this._lostEyes} one="# time" other="# times"/> when you already had {MAX_EYES} Eyes.
			</Trans>,
		}))

		// each window should have a stardiver
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.STARDIVER.icon,
			content: <Trans id="drg.suggestions.stardiver.content">
				Each Life of the Dragon window should contain 1 <ActionLink {...ACTIONS.STARDIVER}/> use.
			</Trans>,
			value: noLifeSd,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			why: <Trans id="drg.suggetions.stardiver.why">{noLifeSd} of your Life of the Dragon windows were missing a <ActionLink {...ACTIONS.STARDIVER}/> use.</Trans>,
		}))

		// each window should have 3 nastronds
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.NASTROND.icon,
			content: <Trans id="drg.suggestions.nastrond.content">Each Life of the Dragon window should contain 3 <ActionLink {...ACTIONS.NASTROND}/> uses.</Trans>,
			value: noFullNsLife,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			why: <Trans id="drg.suggestions.nastrond.why">{noFullNsLife} of your Life of the Dragon windows were missing one or more <ActionLink {...ACTIONS.NASTROND}/> uses.</Trans>,
		}))

		// this suggestion only counts places where a stardiver could be buffed
		// if a window cannot be delayed and has no buffs, it doesn't count
		if (noBuffSd > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.STARDIVER.icon,
				content: <Trans id="drg.blood.suggestions.buffed-stardiver">
					Try to ensure that <ActionLink {...ACTIONS.STARDIVER} /> always lands while at least one of <ActionLink {...ACTIONS.LANCE_CHARGE} />, <ActionLink {...ACTIONS.DRAGON_SIGHT} />, or <ActionLink {...ACTIONS.BATTLE_LITANY} /> is active. Depending on the fight specifics, this may not always be possible. See the <a href="javascript:void(0);" onClick={() => this.parser.scrollTo(this.constructor.handle)}><NormalisedMessage message={this.constructor.title}/></a> module below for details.
				</Trans>,
				value: noBuffSd,
				severity: SEVERITY.MINOR,
				why: <Trans id="drg.blood.suggestions.buffsed-stardiver.why">
					When <ActionLink {...ACTIONS.STARDIVER} /> could have been buffed, you used it <Plural value={noBuffSd} one="# time" other="# times" /> without a buff.
				</Trans>,
			}))
		}
	}

	_windowTable(lifeWindow) {
		const casts = lifeWindow.nastronds.concat(lifeWindow.stardivers)
		casts.sort((a, b) => { return a.timestamp - b.timestamp })

		const rows = casts.map(cast => {
			const buffs = cast.buffs.map(id => {
				return <StatusLink key={id} showName={false} iconSize="35px" {...getDataBy(STATUSES, 'id', id)} />
			})

			return <Table.Row key={cast.timestamp} warning={cast.action.id === ACTIONS.STARDIVER.id && lifeWindow.missedSdBuff}>
				<Table.Cell>{this.createTimelineButton(cast.timestamp)}</Table.Cell>
				<Table.Cell><ActionLink {...cast.action} /></Table.Cell>
				<Table.Cell>{buffs}</Table.Cell>
			</Table.Row>
		})

		const delayBuffs = Object.keys(lifeWindow.buffsInDelayWindow).filter(id => lifeWindow.buffsInDelayWindow[id]).map((id, idx) => {
			const action = getDataBy(ACTIONS, 'id', parseInt(id))
			return <Message.Item key={idx}><Trans id="drg.blood.delay-buff"><ActionLink {...action} /> in {this.parser.formatDuration(lifeWindow.timeToNextBuff[id])}</Trans></Message.Item>
		})

		return <Fragment>
			{lifeWindow.isLast && (
				<Message info>
					<p><Trans id="drg.blood.final-window-explain">This window would last past the end of the fight and does not count against missing casts of <ActionLink {...ACTIONS.NASTROND} /> and <ActionLink {...ACTIONS.STARDIVER} /> in the Suggestions. The warnings will still be shown for completeness.</Trans></p>
				</Message>
			)}
			{lifeWindow.stardivers.length === 0 && (
				<Message error>
					<p><Icon name="warning sign"/> <Trans id="drg.blood.no-stardiver-explain">You did not use <ActionLink {...ACTIONS.STARDIVER}/> during this window.</Trans></p>
				</Message>
			)}
			{lifeWindow.nastronds.length < EXPECTED_NASTRONDS_PER_WINDOW && (
				<Message error>
					<p><Icon name="warning sign"/> <Trans id="drg.blood.no-nastrond-explain">You missed one or more uses of <ActionLink {...ACTIONS.NASTROND}/> during this window.</Trans></p>
				</Message>
			)}
			{lifeWindow.missedSdBuff && (
				<Message warning>
					<p><Trans id="drg.blood.no-buff-stardiver-explain">You did not use <ActionLink {...ACTIONS.STARDIVER}/> while buffed during this window.</Trans></p>
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
					<p><Trans id="drg.blood.no-delay-explain">This window cannot be delayed due to downtime occurring at {this.parser.formatTimestamp(lifeWindow.dtOverlapTime)}. This window would otherwise be delayed for better buff alignment.</Trans></p>
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

	_formatWindowTitle(lifeWindow) {
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

	output() {
		if (this._lifeWindows.history.length > 0) {
			const lotdPanels = this._lifeWindows.history.map(window => {
				return {
					title: {
						key: `title-${window.start}`,
						content: this._formatWindowTitle(window),
					},
					content: {
						key: `content-${window.start}`,
						content: this._windowTable(window),
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
