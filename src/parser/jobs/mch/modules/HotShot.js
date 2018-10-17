import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class HotShot extends Module {
	static handle = 'hotShot'
	static dependencies = [
		'checklist',
		'combatants',
		'heat',
		'invuln',
		'suggestions',
	]

	_hotShotCast = false
	_refreshOverride = false
	_badRefreshes = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.HOT_SHOT.id}, this._onHotShotCast)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.HOT_SHOT.id}, this._onApplyHotShot)
		this.addHook('refreshbuff', {by: 'player', abilityId: STATUSES.HOT_SHOT.id}, this._onRefreshHotShot)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.HOT_SHOT.id}, this._onRemoveHotShot)
		this.addHook('complete', this._onComplete)
	}

	_onHotShotCast() {
		// Set a flag in case they refreshed by the skin of their teeth
		this._hotShotCast = true
	}

	_onApplyHotShot() {
		if (this._refreshOverride) {
			// Treat the event as a refresh
			this._onRefreshHotShot()
		}

		this._hotShotCast = false
	}

	_onRefreshHotShot() {
		if (!this.heat.cooling) {
			this._badRefreshes++
		}

		this._hotShotCast = false
		this._refreshOverride = false
	}

	_onRemoveHotShot() {
		if (this._hotShotCast) {
			// If we get in here, it means they cast when the buff was at <1s and we got the following sequence:
			// Hot Shot cast -> Hot Shot damage -> Hot Shot buff removed -> Hot Shot buff applied
			// If this happens, we want to count it as a refresh event and not an apply event for our metrics
			this._refreshOverride = true
		}
	}

	_getHotShotUptimePercent() {
		const statusUptime = this.combatants.getStatusUptime(STATUSES.HOT_SHOT.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		return (statusUptime / fightUptime) * 100
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="mch.hotshot.checklist.name">Keep Hot Shot up</Trans>,
			description: <Trans id="mch.hotshot.checklist.description">
				<ActionLink {...ACTIONS.HOT_SHOT}/> provides an 8% boost to your personal damage and should always be kept up.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="mch.hotshot.checklist.requirement.name"><ActionLink {...ACTIONS.HOT_SHOT}/> uptime</Trans>,
					percent: () => this._getHotShotUptimePercent(),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HOT_SHOT.icon,
			content: <Trans id="mch.hotshot.suggestions.refresh.content">
				Avoid refreshing <ActionLink {...ACTIONS.HOT_SHOT}/> outside of your post-overheat cooling windows unless absolutely necessary. It's your lowest potency GCD, so it suffers the least from the loss of <ActionLink {...ACTIONS.GAUSS_BARREL}/> during those windows.
			</Trans>,
			tiers: {
				2: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
				6: SEVERITY.MAJOR,
			},
			value: this._badRefreshes,
			why: <Trans id="mch.hotshot.suggestions.refresh.why">
				You refreshed Hot Shot <Plural value={this._badRefreshes} one="# time" other="# times"/> outside of your cooling windows.
			</Trans>,
		}))
	}
}
