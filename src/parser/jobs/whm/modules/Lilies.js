import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Trans, Plural} from '@lingui/react'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'

const LILY_CONSUMERS = [ACTIONS.AFFLATUS_SOLACE.id, ACTIONS.AFFLATUS_RAPTURE.id]
const BLOOD_LILY_CONSUMERS = [ACTIONS.AFFLATUS_MISERY.id]
const LILY_INTERVAL = 30000 // 1 lily every 30 seconds
const BLOOD_LILY_BLOOM = 3 // 1 blood lily for every 3 lilies spent
const WASTED_BLOOD_LILIES_MAX_MEDIUM = 2

export default class Lilies extends Module {
	static handle = 'lilies'
	static dependencies = [
		'suggestions',
	]

	_blooming = 0
	_bloodLiliesGenerated = 0
	_bloodLiliesConsumed = 0
	_bloodLiliesWasted = 0
	_liliesConsumed = 0
	_liliesWasted = 0
	_unused = 0

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
		this.addHook('death', {to: 'player'}, this._onDeath)
	}

	_onCast(event) {
		// this._calculateLilies(event)
		const abilityId = event.ability.guid

		if (LILY_CONSUMERS.includes(abilityId)) {
			this._liliesConsumed++

			if (this._blooming === BLOOD_LILY_BLOOM) {
				// if we already have a blood lily, we are wasting this lily
				this._liliesWasted++
			} else if (++this._blooming === BLOOD_LILY_BLOOM) {
				this._bloodLiliesGenerated++
			}
		}

		if (BLOOD_LILY_CONSUMERS.includes(abilityId)) {
			// reset our blood lilies
			this._blooming = 0
			this._bloodLiliesConsumed++
		}
	}

	_onComplete() {
		this.checkBloodLilies()
		this.checkLilyCapping()
	}

	_onDeath() {
		// death is bad, because it also resets your lilies
		this._blooming = 0
	}

	checkLilyCapping() {
		const fightLength = (this.parser.fight.end_time - this.parser.fight.start_time)
		const possible = Math.floor(fightLength / LILY_INTERVAL)
		this._unused = possible - this._liliesConsumed

		if (this._unused > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.AFFLATUS_SOLACE.icon,
				content: <Fragment>
					<Trans id="whm.lily-cap.suggestion.content">
						Use <ActionLink {...ACTIONS.AFFLATUS_SOLACE} /> or <ActionLink {...ACTIONS.AFFLATUS_RAPTURE} /> regularly to avoid capping your lilies.
					</Trans>
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					<Trans id="whm.lily-cap.suggestion.why">
						{<Plural value={this._unused} one="# lily" other="# lilies" />} went unused.
					</Trans>
				</Fragment>,
			}))
		}
	}

	checkBloodLilies() {
		this._bloodLiliesWasted = Math.floor(this._liliesWasted / BLOOD_LILY_BLOOM) + (this._blooming === BLOOD_LILY_BLOOM)

		if (this._bloodLiliesWasted >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.AFFLATUS_MISERY.icon,
				content: <Fragment>
					<Trans id="whm.lily-blood.suggestion.content">
						Use <ActionLink {...ACTIONS.AFFLATUS_MISERY} /> to avoid wasting blood lily growth.
					</Trans>
				</Fragment>,
				severity: this._bloodLiliesWasted > WASTED_BLOOD_LILIES_MAX_MEDIUM ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Fragment>
					<Trans id="whm.lily-blood.suggestion.why">
						<Plural value={this._bloodLiliesWasted} one="# blood lily" other="# blood lilies" /> did not bloom due to early lily use.
					</Trans>
				</Fragment>,
			}))
		}
	}
}
