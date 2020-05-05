import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Cooldowns from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

// Tri-disaster is checked here instead of with other cooldowns because
// its usage rules are different.  CooldownDowntime would expect you to
// use it immediately after a reset, result in a pattern of:
//  3D - Trance - (immediate) 3D - <cooldown> - 3D - Trance - (immediate) 3D
// Instead, this module checks that trance abilities and DoT spells are
// not cast when Tri-disaster is available.  This should ensure that
// Tri-disaster has been used approrpriate when combined with the general
// checks for DoT uptime and clipping.

// timestamps are ms, array has s
const TRI_DISASTER_COOLDOWN = ACTIONS.TRI_DISASTER.cooldown * 1000

export default class TriDisaster extends Module {
	static handle = 'tridisaster'
	static title = t('smn.tridisaster.title')`Tri-disaster`
	static debug = true

	@dependency private cooldowns!: Cooldowns
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private lastTriDCast = -TRI_DISASTER_COOLDOWN
	private badCastCount = 0

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.TRI_DISASTER.id}, this.onTridisaster)
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.DREADWYRM_TRANCE.id, ACTIONS.FIREBIRD_TRANCE.id]}, this.onReset)
		this.addEventHook('cast', {by: 'player', abilityId: [ACTIONS.BIO_III.id, ACTIONS.MIASMA_III.id]}, this.checkCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onTridisaster(event: CastEvent) {
		this.lastTriDCast = event.timestamp
	}

	private onReset(event: CastEvent) {
		this.cooldowns.resetCooldown(this.data.actions.TRI_DISASTER.id)
		this.checkCast(event)
		this.lastTriDCast = -TRI_DISASTER_COOLDOWN
	}

	private checkCast(event: CastEvent) {
		if (event.timestamp - this.lastTriDCast > TRI_DISASTER_COOLDOWN) {
			this.badCastCount++
		}
	}

	private onComplete() {
		if (this.badCastCount > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.TRI_DISASTER.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="smn.tridisaster.content">
					Make sure <ActionLink {...ACTIONS.TRI_DISASTER}/> is on cooldown before casting an ability
					that resets it (<ActionLink {...ACTIONS.DREADWYRM_TRANCE}/> and <ActionLink {...ACTIONS.FIREBIRD_TRANCE}/>)
					and before casting DoTs manually (with <ActionLink {...ACTIONS.BIO_III}/> and <ActionLink {...ACTIONS.MIASMA_III}/>)
				</Trans>,
				why: <Trans id="smn.tridisaster.why">
					Abilities were cast with Tri-disaster off cooldown <Plural value={this.badCastCount} one="# time" other="# times"/>.
				</Trans>,
			}))
		}
	}
}
