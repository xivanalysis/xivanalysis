import React, { Fragment } from 'react'

import { ActionLink, StatusLink } from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import { Rule, Requirement } from 'parser/core/modules/Checklist'
import { Suggestion, SEVERITY } from 'parser/core/modules/Suggestions'

const FESTER_STATUSES = [
	STATUSES.BIO_III.id,
	STATUSES.MIASMA_III.id
]

export default class Aetherflow extends Module {
	static dependencies = [
		'checklist',
		'cooldowns',
		'enemies',
		'gauge',
		'suggestions'
	]

	_painflareCast = null
	_painflareHits = 0

	_badFesters = []
	_badPainflares = []

	on_cast_byPlayer(event) {
		const actionId = event.ability.guid

		// Process any painflare hits
		this._processPainflare()

		// Make sure all festers have the required dots up for Festers
		if (actionId === ACTIONS.FESTER.id) {
			const target = this.enemies.getEntity(event.targetID)
			const numStatuses = FESTER_STATUSES.filter(statusId => target.hasStatus(statusId)).length
			if (numStatuses !== FESTER_STATUSES.length) {
				this._badFesters.push(event)
			}
		}

		// When PF is cast, save the event in case we need it
		if (actionId === ACTIONS.PAINFLARE.id) {
			this._painflareCast = event
		}
	}

	on_damage_byPlayer(event) {
		const actionId = event.ability.guid

		// If it was PF hit, add it to the counter
		if (actionId === ACTIONS.PAINFLARE.id) {
			this._painflareHits ++
		}
	}

	on_complete() {
		// Clean up any PF hits in case it was the last skill cast
		this._processPainflare()

		// Checklist rule for aetherflow cooldown
		this.checklist.add(new Rule({
			name: <Fragment>Use <ActionLink {...ACTIONS.AETHERFLOW} /> effectively</Fragment>,
			description: 'SMN\'s entire kit revolves around the Aetherflow cooldown. Make sure you squeeze every possible use out of it that you can.',
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.AETHERFLOW} /> cooldown uptime</Fragment>,
					percent: (this.cooldowns.getTimeOnCooldown(ACTIONS.AETHERFLOW.id) / (this.parser.fightDuration - 15000)) * 100
				})
			]
		}))

		// Suggestion for bad festers
		const numBadFesters = this._badFesters.length
		if (numBadFesters) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.FESTER.icon,
				content: <Fragment>
					To get the most potency out of your <ActionLink {...ACTIONS.FESTER}/>s, ensure both <StatusLink {...STATUSES.BIO_III}/> and <StatusLink {...STATUSES.MIASMA_III}/> are applied to your target. Avoid casting Fester directly after DoT application, as the status takes a short period to apply.
				</Fragment>,
				severity: numBadFesters < 5? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					{numBadFesters} cast{numBadFesters > 1 && 's'} of Fester on targets without both DoTs.
				</Fragment>
			}))
		}

		const numBadPainflares = this._badPainflares.length
		if (numBadPainflares) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.PAINFLARE.icon,
				content: <Fragment>
					Avoid casting <ActionLink {...ACTIONS.PAINFLARE}/> on a single target unless rushing a <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/>, as it deals less damage than <ActionLink {...ACTIONS.FESTER}/> per hit.
				</Fragment>,
				severity: numBadPainflares < 5? SEVERITY.MEDIUM : SEVERITY.MAJOR,
				why: <Fragment>
					{numBadPainflares} single-target cast{numBadPainflares > 1 && 's'} of Painflare.
				</Fragment>
			}))
		}
	}

	_processPainflare() {
		// Don't need to do anything if it wasn't cast.
		if (!this._painflareCast) {
			return
		}

		// Only fault single target PFs _outside_ rushes.
		if (this._painflareHits <= 1 && !this.gauge.isRushing()) {
			this._badPainflares.push(this._painflareCast)
		}

		// Reset the state for the next PF (if there is any)
		this._painflareCast = null
		this._painflareHits = 0
	}
}
