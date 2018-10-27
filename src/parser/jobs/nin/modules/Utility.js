import {Trans} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Constants for when we expect Shadewalker and Smokescreen to be cast. If they aren't cast by this point in the fight, it's a warning.
const SHADEWALKER_EXPECTED_BY_MILLIS = ACTIONS.SHADEWALKER.cooldown * 1000
const SMOKE_SCREEN_EXPECTED_BY_MILLIS = ACTIONS.SMOKE_SCREEN.cooldown * 1000

// Constants for how long the SW/SS statuses should have on their timers at minimum when the fight starts. If they're too low, they were used too early.
// Shadewalker should ideally have no more than 4 seconds off of its max duration on pull, and Smoke Screen 6.
// eslint-disable-next-line no-magic-numbers
const SHADEWALKER_PREPULL_MILLIS = (STATUSES.SHADEWALKER.duration - 4) * 1000
// eslint-disable-next-line no-magic-numbers
const SMOKE_SCREEN_PREPULL_MILLIS = (STATUSES.SMOKE_SCREEN.duration - 6) * 1000

export default class Utility extends Module {
	static handle = 'utility'
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_castHook = null

	_shadewalkerUsed = false
	_smokeScreenUsed = false

	_shadewalkerDuration = -1
	_shadewalkerRemovedHook = null
	_smokeScreenDuration = -1
	_smokeScreenRemovedHook = null

	constructor(...args) {
		super(...args)
		this._castHook = this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.SHADEWALKER.id}, this._onShadewalkerCast)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.SMOKE_SCREEN.id}, this._onSmokeScreenCast)
		this._shadewalkerRemovedHook = this.addHook('removebuff', {abilityId: STATUSES.SHADEWALKER.id}, this._onShadewalkerRemoved)
		this._smokeScreenRemovedHook = this.addHook('removebuff', {abilityId: STATUSES.SMOKE_SCREEN.id}, this._onSmokeScreenRemoved)
		this.addHook('complete', this._onComplete)
	}

	_onCast() {
		// This will only fire for the first cast of the fight - we need to check Shadewalker/Smoke Screen status for pre-pull use
		if (this.combatants.selected.hasStatus(STATUSES.SHADEWALKER.id)) {
			this._shadewalkerUsed = true
			this._shadewalkerDuration = this.parser.fight.start_time
		}

		const entities = this.combatants.getEntities()
		const ssTarget = Object.values(entities).find(entity => entity.hasStatus(STATUSES.SMOKE_SCREEN.id))
		if (ssTarget) {
			this._smokeScreenUsed = true
			this._smokeScreenDuration = this.parser.fight.start_time
		}

		this.removeHook(this._castHook)
		this._castHook = null
	}

	_onShadewalkerCast(event) {
		if (event.timestamp - this.parser.fight.start_time <= SHADEWALKER_EXPECTED_BY_MILLIS) {
			this._shadewalkerUsed = true
		}
	}

	_onSmokeScreenCast(event) {
		if (event.timestamp - this.parser.fight.start_time <= SMOKE_SCREEN_EXPECTED_BY_MILLIS) {
			this._smokeScreenUsed = true
		}
	}

	_onShadewalkerRemoved(event) {
		if (this._shadewalkerDuration >= 0) {
			// Only true if it was used pre-pull
			this._shadewalkerDuration = event.timestamp - this._shadewalkerDuration
		}

		this.removeHook(this._shadewalkerRemovedHook)
		this._shadewalkerRemovedHook = null
	}

	_onSmokeScreenRemoved(event) {
		if (this._smokeScreenDuration >= 0) {
			// Only true if it was used pre-pull
			this._smokeScreenDuration = event.timestamp - this._smokeScreenDuration
		}

		this.removeHook(this._smokeScreenRemovedHook)
		this._smokeScreenRemovedHook = null
	}

	_onComplete() {
		if (!this._shadewalkerUsed) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SHADEWALKER.icon,
				content: <Trans id="nin.utility.suggestions.no-shade.content">
					<ActionLink {...ACTIONS.SHADEWALKER}/> should almost always be used on the pull, as it will help your main tank solidify threat much more quickly and reduce everyone else's risk of stealing threat.
				</Trans>,
				severity: SEVERITY.MEDIUM,
				why: <Trans id="nin.utility.suggestions.no-shade.why">
					You didn't use Shadewalker pre-pull or within the first {this.parser.formatDuration(SHADEWALKER_EXPECTED_BY_MILLIS)} of the fight.
				</Trans>,
			}))
		}

		if (this._shadewalkerDuration >= 0 && this._shadewalkerDuration < SHADEWALKER_PREPULL_MILLIS) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SHADEWALKER.icon,
				content: <Trans id="nin.utility.suggestions.early-shade.content">
					Avoid using <ActionLink {...ACTIONS.SHADEWALKER}/> too early on the countdown. If using it pre-pull, you should ideally start the fight with at least {this.parser.formatDuration(SHADEWALKER_PREPULL_MILLIS)} of the buff remaining.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="nin.utility.suggestions.early-shade.why">
					Shadewalker only had {this.parser.formatDuration(this._shadewalkerDuration)} left when the fight started, reducing its effectiveness.
				</Trans>,
			}))
		}

		if (!this._smokeScreenUsed) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SMOKE_SCREEN.icon,
				content: <Trans id="nin.utility.suggestions.no-smoke.content">
					<ActionLink {...ACTIONS.SMOKE_SCREEN}/> can be a very useful utility for your party and should be used to help mitigate the threat generated by high burst DPS or burst healing windows.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="nin.utility.suggestions.no-smoke.why">
					You didn't use Smoke Screen pre-pull or within the first {this.parser.formatDuration(SMOKE_SCREEN_EXPECTED_BY_MILLIS)} of the fight.
				</Trans>,
			}))
		}

		if (this._smokeScreenDuration >= 0 && this._smokeScreenDuration < SMOKE_SCREEN_PREPULL_MILLIS) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SMOKE_SCREEN.icon,
				content: <Trans id="nin.utility.suggestions.early-smoke.content">
					Avoid using <ActionLink {...ACTIONS.SMOKE_SCREEN}/> too early on the countdown. If using it pre-pull, you should ideally start the fight with at least {this.parser.formatDuration(SMOKE_SCREEN_PREPULL_MILLIS)} of the buff remaining.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="nin.utility.suggestions.early-smoke.why">
					Smoke Screen only had {this.parser.formatDuration(this._smokeScreenDuration)} left when the fight started, reducing its effectiveness.
				</Trans>,
			}))
		}
	}
}
