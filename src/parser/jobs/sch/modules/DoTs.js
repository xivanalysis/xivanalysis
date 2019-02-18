import React, {Fragment} from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import CoreDoTs from 'parser/core/modules/DoTs'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const SHADOW_FLARE_DURATION = 15000

// In ms
const CLIPPING_SEVERITY = {
	1000: SEVERITY.MINOR,
	10000: SEVERITY.MEDIUM,
	30000: SEVERITY.MAJOR,
}

export default class DoTs extends CoreDoTs {
	static handle = 'dots'

	static dependencies = [
		...DoTs.dependencies,
		'checklist',
		'combatants',
		'invuln',
		'suggestions',
	]

	static statusesToTrack = [
		STATUSES.BIO_II.id,
		STATUSES.MIASMA.id,
	]

	addChecklistRules() {
		this.checklist.add(new Rule({
			name: 'Keep your DoTs up',
			description: <Fragment>
				As a Scholar, DoTs are a significant portion of your sustained damage. Aim to keep them up at all times.
			</Fragment>,
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.BIO_II} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(STATUSES.BIO_II.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.MIASMA} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(STATUSES.MIASMA.id),
				}),
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.SHADOW_FLARE}/> uptime</Fragment>,
					percent: () => this.getShadowFlareUptimePercent(),
				}),
			],
		}))
	}

	addClippingSuggestions(clip) {

		const maxClip = Math.max([this.getClippingAmount(STATUSES.BIO_II.id), this.getClippingAmount(STATUSES.MIASMA.id)])
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.BIO.icon,
			content: <Fragment>
				Avoid refreshing DoTs significantly before their expiration, except when at the end of the fight. Unnecessary refreshes use up your mana more than necessary, and may cause you to go out of mana.
			</Fragment>,
			tiers: CLIPPING_SEVERITY,
			value: maxClip,
			why: <Fragment>
				{this.parser.formatDuration(clip[STATUSES.BIO_II.id])} of <StatusLink {...STATUSES.BIO_II}/> and {this.parser.formatDuration(clip[STATUSES.MIASMA.id])} of <StatusLink {...STATUSES.MIASMA}/> lost to early refreshes.
			</Fragment>,
		}))
	}

	getShadowFlareUptimePercent() {
		const fightDuration = this.parser.fightDuration - this.invuln.getInvulnerableUptime()
		// Calc the total number of SF casts you coulda got off (minus the last 'cus floor)
		const maxFullCasts = Math.floor(fightDuration / (ACTIONS.SHADOW_FLARE.cooldown * 1000))

		// Calc the possible time for the last one
		const lastCastMaxDuration = Math.min(
			SHADOW_FLARE_DURATION,
			fightDuration - (maxFullCasts * ACTIONS.SHADOW_FLARE.cooldown)
		)

		const maxTotalDuration = (maxFullCasts * SHADOW_FLARE_DURATION) + lastCastMaxDuration

		// Get as %. Capping to 100%.
		return Math.min(100, (this.combatants.getStatusUptime(STATUSES.SHADOW_FLARE.id) / maxTotalDuration) * 100)
	}
}
