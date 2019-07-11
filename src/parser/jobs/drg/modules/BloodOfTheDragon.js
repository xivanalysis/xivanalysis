import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const DRAGON_MAX_DURATION_MILLIS = 30000
const DRAGON_DEFAULT_DURATION_MILLIS = 30000
const BLOOD_EXTENSION_MILLIS = 10000

const MAX_EYES = 2

export default class BloodOfTheDragon extends Module {
	static handle = 'bloodOfTheDragon'
	static title = t('drg.blood.title')`Life of the Dragon`
	static dependencies = [
		'brokenLog',
		'checklist',
		'death',
		'suggestions',
	]

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
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.FANG_AND_CLAW.id, ACTIONS.WHEELING_THRUST.id]}, this._onExtenderCast)
		this.addHook('combo', {by: 'player', abilityId: ACTIONS.SONIC_THRUST.id}, this._onExtenderCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.BLOOD_OF_THE_DRAGON.id}, this._onBloodCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.MIRAGE_DIVE.id}, this._onMirageDiveCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.GEIRSKOGUL.id}, this._onGeirskogulCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.NASTROND.id}, this._onNastrondCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.STARDIVER.id}, this._onStardiverCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('raise', {to: 'player'}, this._onRaise)
		this.addHook('complete', this._onComplete)
	}

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
			this._lifeWindows.current.nastronds.push(event)
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
			this._lifeWindows.current.stardivers.push(event)
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

	_onComplete() {
		this._finishLifeWindow()
		const duration = this.parser.fightDuration - this.death.deadTime
		const uptime = ((duration - this._bloodDowntime) / duration) * 100
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
			displayOrder: DISPLAY_ORDER.BLOOD_OF_THE_DRAGON,
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
	}

	output() {
		if (this._lifeWindows.history.length > 0) {
			return <Fragment>
				<Trans id="drg.blood.windows.preface">
					Each of the bullets below represents a Life of the Dragon window, indicating when it started, how long it lasted, and how many window-restricted OGCDs it contained. Ideally, each window should contain a full three <ActionLink {...ACTIONS.NASTROND}/> casts and one <ActionLink {...ACTIONS.STARDIVER}/> cast.
				</Trans>
				<ul>
					{this._lifeWindows.history.map(window => <li key={window.start}>
						<strong>{this.parser.formatTimestamp(window.start)}</strong>:&nbsp;
						<Trans id="drg.blood.windows.hits">
							{this.parser.formatDuration(window.duration)} long, <Plural value={window.nastronds.length} one="# Nastrond" other="# Nastronds"/>, <Plural value={window.stardivers.length} one="# Stardiver" other="# Stardivers"/>
						</Trans>
					</li>)}
				</ul>
			</Fragment>
		}

		// This should really never happen but if they didn't go into LotD once, we shouldn't bother showing the section
		return false
	}
}
