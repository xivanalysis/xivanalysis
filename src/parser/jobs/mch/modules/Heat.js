import {Trans, Plural, i18nMark} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Constants
const BARREL_STATE = {
	NORMAL: 0,
	GAUSS: 1,
	OVERHEATED: 2,
	COOLING: 3,
}

const MAX_HEAT = 100
const HEATED_POINT = 50
const COOLDOWN_HEAT_REDUCTION = 25

const HEAT_BUILDERS = {
	[ACTIONS.SPLIT_SHOT.id]: 5,
	[ACTIONS.SLUG_SHOT.id]: 5,
	[ACTIONS.SPREAD_SHOT.id]: 5,
	[ACTIONS.HOT_SHOT.id]: 5,
	[ACTIONS.CLEAN_SHOT.id]: 5,
	[ACTIONS.HEATED_SPLIT_SHOT.id]: 5,
	[ACTIONS.HEATED_SLUG_SHOT.id]: 5,
	[ACTIONS.HEATED_CLEAN_SHOT.id]: 5,
}
const FLAMETHROWER_TICK_HEAT_GAIN = 20
const FLAMETHROWER_TICK_MILLIS = 1000
const FLAMETHROWER_FUZZ_MILLIS = 50 // Fuzz factor for FT - if it ends within 50ms of the next tick, we should count the tick

const OVERHEAT_DURATION_MILLIS = 10000
const COOLING_DURATION_MILLIS = 10000
const COOLING_FUZZ_MILLIS = 250 // Fuzz factor for post-cooling GB application, since the sim is imperfect

const OVERHEAT_GCD_TARGET = 6
const OVERHEAT_GCD_WARNING = 4
const OVERHEAT_GCD_ERROR = 0

export default class Heat extends Module {
	static handle = 'heat'
	static i18n_id = i18nMark('mch.heat.title')
	static title = 'Overheat Windows'
	static dependencies = [
		'ammo',
		'suggestions',
	]

	_barrelState = BARREL_STATE.GAUSS // Null assumption
	_barrelStateTime = {
		[BARREL_STATE.NORMAL]: 0,
		[BARREL_STATE.GAUSS]: 0,
		[BARREL_STATE.OVERHEATED]: 0,
		[BARREL_STATE.COOLING]: 0,
	}
	_lastBarrelStateChange = this.parser.fight.start_time
	_flamethrowerApplied = -1
	_heat = 0
	_overheatWindows = {
		current: null,
		history: [],
	}
	_badCooldowns = 0
	_lockoutCooldowns = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.FLAMETHROWER.id}, this._onApplyFlamethrower)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.FLAMETHROWER.id}, this._onRemoveFlamethrower)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_setBarrelState(newState, timeAdjustment) {
		if (!timeAdjustment) {
			// The overheat and cooldown periods are a flat 10s, which we don't get events for, so setting those two states will
			// need to pass in a manual adjustment. If one isn't passed, it means the we have an actual event, so base the
			// adjustment on the relative timestamps instead.
			timeAdjustment = (this.parser.currentTimestamp - this._lastBarrelStateChange)
		}

		this._barrelStateTime[this._barrelState] += timeAdjustment
		this._barrelState = newState
		this._lastBarrelStateChange += timeAdjustment
	}

	_fixNullAssumption() {
		// If this is called, the MCH -really- fucked up, since it only happens if Gauss Barrel is cast when it shouldn't be castable.
		// It means that the null assumption (they started with Gauss equipped) was incorrect and we need to clean that shit up.
		this._barrelState = BARREL_STATE.NORMAL
		this._heat = 0
		this._overheatWindows.current = null
		this._setBarrelState(BARREL_STATE.GAUSS)
	}

	_addHeat(amount) {
		this._heat += amount
		if (this._heat >= MAX_HEAT) {
			// We overheating now, bois
			this._setBarrelState(BARREL_STATE.OVERHEATED)
			this._overheatWindows.current = {
				start: this.parser.currentTimestamp,
				casts: [],
			}
		}
	}

	_onCast(event) {
		// This is a bit goofy but here's the reasoning: -Any- action while channeling FT will disrupt it, and we need to add the heat
		// as soon as that happens (before the interrupting action is handled). The function will add heat if we have an application
		// timestamp stored, and it clears the flag out in the process, so we won't need to worry about remove getting fired twice.
		this._onRemoveFlamethrower(event)

		const abilityId = event.ability.guid

		switch (this._barrelState) {
		case BARREL_STATE.NORMAL:
			if (abilityId === ACTIONS.GAUSS_BARREL.id) {
				this._setBarrelState(BARREL_STATE.GAUSS)
			}
			break
		case BARREL_STATE.GAUSS:
			if (abilityId === ACTIONS.GAUSS_BARREL.id) {
				this._fixNullAssumption()
			} else if (abilityId === ACTIONS.REMOVE_BARREL.id) {
				// y tho
				this._heat = 0
				this._setBarrelState(BARREL_STATE.NORMAL)
			} else if (HEAT_BUILDERS.hasOwnProperty(abilityId) && !this.ammo.ammoSpent) {
				this._addHeat(HEAT_BUILDERS[abilityId])
			} else if (abilityId === ACTIONS.COOLDOWN.id) {
				this._heat = Math.max(this._heat - COOLDOWN_HEAT_REDUCTION, 0) // Floor at 0, just to be safe
				if (this._heat < HEATED_POINT) {
					this._badCooldowns++
				}
			} else if (abilityId === ACTIONS.BARREL_STABILIZER.id) {
				this._heat = HEATED_POINT
			}
			break
		case BARREL_STATE.OVERHEATED:
			if (abilityId === ACTIONS.GAUSS_BARREL.id) {
				this._fixNullAssumption()
			} else if (event.timestamp - this._lastBarrelStateChange < OVERHEAT_DURATION_MILLIS) {
				this._overheatWindows.current.casts.push(event)
				if (this.ammo.ammoSpent) {
					// Don't count typically bad ammo expenditures if they happen during OH
					this.ammo.negateBadAmmoUse(abilityId)
				}
			} else {
				this._overheatWindows.current.gcdCount = this._overheatWindows.current.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
				this._overheatWindows.history.push(this._overheatWindows.current)
				this._heat = 0
				this._setBarrelState(BARREL_STATE.COOLING, OVERHEAT_DURATION_MILLIS)
			}
			break
		case BARREL_STATE.COOLING:
			if (event.timestamp - this._lastBarrelStateChange >= COOLING_DURATION_MILLIS - COOLING_FUZZ_MILLIS) {
				this._setBarrelState(BARREL_STATE.NORMAL, COOLING_DURATION_MILLIS)
				if (abilityId === ACTIONS.GAUSS_BARREL.id) {
					this._setBarrelState(BARREL_STATE.GAUSS)
				}
			} else if (abilityId === ACTIONS.COOLDOWN.id) {
				this._lockoutCooldowns++
			} else if (abilityId === ACTIONS.GAUSS_BARREL.id) {
				this._fixNullAssumption()
			}
			break
		}
	}

	_onApplyFlamethrower(event) {
		this._flamethrowerApplied = event.timestamp
	}

	_onRemoveFlamethrower(event) {
		if (this._flamethrowerApplied > -1) {
			// The first tick is always within a few milliseconds of the buff application and all subsequent ticks fire 1 second after the last
			const ticks = Math.floor((event.timestamp - this._flamethrowerApplied + FLAMETHROWER_FUZZ_MILLIS) / FLAMETHROWER_TICK_MILLIS) + 1
			this._addHeat(ticks * FLAMETHROWER_TICK_HEAT_GAIN)
			this._flamethrowerApplied = -1
		}
	}

	_onDeath() {
		this._heat = 0
		this._setBarrelState(BARREL_STATE.NORMAL)
	}

	_onComplete() {
		this._setBarrelState(BARREL_STATE.NORMAL) // So we tally the barrel state for the last chunk of the fight
		const averageGaussDowntime = this._barrelStateTime[BARREL_STATE.NORMAL] / this._overheatWindows.history.length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.GAUSS_BARREL.icon,
			content: <Trans id="mch.heat.suggestions.downtime.content">
				Make sure to use <ActionLink {...ACTIONS.GAUSS_BARREL}/> as soon as it's available after overheat/cooldown windows, as you can't build up heat without it.
			</Trans>,
			tiers: {
				1000: SEVERITY.MINOR,
				3000: SEVERITY.MEDIUM,
			},
			value: averageGaussDowntime,
			why: <Trans id="mch.heat.suggestions.downtime.why">
				Gauss Barrel was down for {this.parser.formatDuration(this._barrelStateTime[BARREL_STATE.NORMAL])}.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.COOLDOWN.icon,
			content: <Trans id="mch.heat.suggestions.cooldown.content">
				Avoid using <ActionLink {...ACTIONS.COOLDOWN}/> if it would bring you below {HEATED_POINT} heat. Dipping too low will cost you heated shots and may delay overheat windows, throwing off your rotation and OGCD alignment.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this._badCooldowns,
			why: <Trans id="mch.heat.suggestions.cooldown.why">
				You misused Cooldown <Plural value={this._badCooldowns} one="# time" other="# times"/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.COOLDOWN.icon,
			content: <Trans id="mch.heat.suggestions.cooldown-lockout.content">
				Avoid using <ActionLink {...ACTIONS.COOLDOWN}/> while your barrel is cooling after an overheat window, as it has the second lowest potency of your single-target weaponskills when your heat gauge is below 50.
			</Trans>,
			tiers: {
				2: SEVERITY.MINOR,
				5: SEVERITY.MEDIUM,
				10: SEVERITY.MAJOR,
			},
			value: this._lockoutCooldowns,
			why: <Trans id="mch.heat.suggestions.cooldown-lockout.why">
				You cast Cooldown <Plural value={this._lockoutCooldowns} one="# time" other="# times"/> while your barrel was cooling.
			</Trans>,
		}))
	}

	_formatGcdCount(count) {
		if (count === OVERHEAT_GCD_ERROR) {
			return <span className="text-error">{count}</span>
		}

		if (count <= OVERHEAT_GCD_WARNING) {
			return <span className="text-warning">{count}</span>
		}

		return count
	}

	output() {
		const panels = this._overheatWindows.history.map(overheat => {
			return {
				title: {
					key: 'title-' + overheat.start,
					content: <Fragment>
						{this.parser.formatTimestamp(overheat.start)}
						<span> - </span>
						{this._formatGcdCount(overheat.gcdCount)}/{OVERHEAT_GCD_TARGET} <Plural id="mch.heat.panel-count" value={overheat.gcdCount} one="GCD" other="GCDs"/>
					</Fragment>,
				},
				content: {
					key: 'content-' + overheat.start,
					content: <Rotation events={overheat.casts}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="mch.heat.accordion.message">Every overheat window should ideally include <ActionLink {...ACTIONS.WILDFIRE}/>, <ActionLink {...ACTIONS.RAPID_FIRE}/>, and {OVERHEAT_GCD_TARGET} GCDs ({OVERHEAT_GCD_TARGET - 1} is also fine if you play with high ping). Each overheat window below indicates how many GCDs it contained and will display all the casts in the window if expanded.</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</Fragment>
	}

	get overheated() { return this._barrelState === BARREL_STATE.OVERHEATED }

	get cooling() { return this._barrelState === BARREL_STATE.COOLING }
}
