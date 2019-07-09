import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {Trans, Plural} from '@lingui/react'
import {TieredRule, Requirement, TARGET} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'

const LILY_CONSUMERS = [ACTIONS.AFFLATUS_SOLACE.id, ACTIONS.AFFLATUS_RAPTURE.id]
const BLOOD_LILY_CONSUMERS = [ACTIONS.AFFLATUS_MISERY.id]
const MAX_LILIES = 3
const LILY_INTERVAL = 30000 // 1 lily every 30 seconds
const BLOOD_LILY_GENERATION = 3 // 1 blood lily for every 3 lilies spent
const UNUSED_LILIES_MAX_MINOR = 3
const WASTED_LILIES_MAX_MEDIUM = 2

export default class Lilies extends Module {
	static handle = 'lilies'
	static dependencies = [
		'checklist',
		'suggestions',
	]

	_lastGained = 0
	_bloodLilyTracker = 0
	_lilies = 0
	_unusedLilies = 0
	_wastedLilies = 0
	_bloodLily = 0
	_totalLilies = 0
	_totalBloodLilies = 0
	_missedBloodLilies = 0

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
		this.addHook('death', {to: 'player'}, this._onDeath)
	}

	_onCast(event) {
		this._calculateLilies(event)
		const abilityId = event.ability.guid

		if (LILY_CONSUMERS.includes(abilityId)) {
			this._lilies--
			this._bloodLilyTracker++

			if (this._bloodLily === 1) {
				// if we already have a blood lily, we are wasting this lily
				this._wastedLilies++
			}

			if (this._bloodLilyTracker === BLOOD_LILY_GENERATION) {
				// we have generated a blood lily
				this._bloodLily = 1
				this._totalBloodLilies++
			}
		}

		if (BLOOD_LILY_CONSUMERS.includes(abilityId)) {
			// reset our blood lilies
			this._bloodLily = 0
			this._bloodLilyTracker = 0
		}
	}

	_onComplete() {
		this.checkBloodLilies()
		this.checkLilyCapping()
	}

	_onDeath() {
		// death is bad, because it also resets your lilies
		this._lilies = 0
		this._bloodLily = 0
		this._bloodLilyTracker = 0
	}

	checkLilyCapping() {
		// todo: Check whether moving dropped a GCD while you had a lily available.
		const capWarnTarget = (this._totalLilies - 1) / this._totalLilies * 100
		const capFailTarget = (this._totalLilies - UNUSED_LILIES_MAX_MINOR) / this._totalLilies * 100
		this.checklist.add(new TieredRule({
			name: <Trans id="whm.lily-cap.checklist.name">
				Avoid capping your Lilies
			</Trans>,
			description: <Trans id="whm.lily-cap.checklist.content">
				White Mages add a lily to their Healing Gauge for every 30 seconds they are engaged in combat, up to a maximum of 3. Cast <ActionLink {...ACTIONS.AFFLATUS_SOLACE} /> or <ActionLink {...ACTIONS.AFFLATUS_RAPTURE} /> before you would add a lily to an already full gauge.  You may be able to ignore this if there was nothing to heal and you chose to DPS, instead.
			</Trans>,
			tiers: {[capWarnTarget]: TARGET.WARN, [capFailTarget]: TARGET.FAIL, 100: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="whm.lily-cap.checklist.requirement.name">
						Lilies Used
					</Trans>,
					value: this._totalLilies - this._unusedLilies,
					target: this._totalLilies,
				}),
			],
		}))

		if (this._unusedLilies > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.AFFLATUS_SOLACE.icon,
				content: <Fragment>
					<Trans id="whm.lily-cap.suggestion.content">
						Use <ActionLink {...ACTIONS.AFFLATUS_SOLACE} /> or <ActionLink {...ACTIONS.AFFLATUS_RAPTURE} /> regularly to avoid capping your lilies.
					</Trans>
				</Fragment>,
				severity: this._unusedLilies >= UNUSED_LILIES_MAX_MINOR ? SEVERITY.MEDIUM : SEVERITY.MINOR,
				why: <Fragment>
					<Trans id="whm.lily-cap.suggestion.why">
						{<Plural value={this._unusedLilies} one="# lily" other="# lilies" />} lost to lily cap.
					</Trans>
				</Fragment>,
			}))
		}
	}

	checkBloodLilies() {
		const possibleBloodLilies = (this._totalLilies / BLOOD_LILY_GENERATION)
		console.log('possible = ', possibleBloodLilies, this._totalLilies)
		this._missedBloodLilies = possibleBloodLilies - this._totalBloodLilies
		const bloodWarnTarget = (possibleBloodLilies - 1) / possibleBloodLilies * 100
		const bloodFailTarget = (possibleBloodLilies - WASTED_LILIES_MAX_MEDIUM) / possibleBloodLilies * 100

		this.checklist.add(new TieredRule({
			name: <Trans id="whm.lily-blood.checklist.name">
				Spend your Blood Lily
			</Trans>,
			description: <Trans id="whm.lily-blood.checklist.content">
				Never use <ActionLink {...ACTIONS.AFFLATUS_SOLACE} /> or <ActionLink {...ACTIONS.AFFLATUS_RAPTURE} /> when <ActionLink {...ACTIONS.AFFLATUS_MISERY} /> is available.  You lose DPS, and may miss the generation of additional Blood Lilies.
			</Trans>,
			tiers: {[bloodWarnTarget]: TARGET.WARN, [bloodFailTarget]: TARGET.FAIL, 100: TARGET.SUCCESS},
			requirements: [
				new Requirement({
					name: <Trans id="whm.lily-blood.checklist.requirement.name">
						Blood Lilies Generated
					</Trans>,
					value: this._totalBloodLilies,
					target: Math.floor(possibleBloodLilies),
				}),
			],
		}))

		if (this._missedBloodLilies >= 1) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.AFFLATUS_MISERY.icon,
				content: <Fragment>
					<Trans id="whm.lily-blood.suggestion.content">
						Use <ActionLink {...ACTIONS.AFFLATUS_MISERY} /> to avoid wasting blood lily growth.
					</Trans>
				</Fragment>,
				severity: this._missedBloodLilies >= WASTED_LILIES_MAX_MEDIUM ? SEVERITY.MAJOR : SEVERITY.MEDIUM,
				why: <Fragment>
					<Trans id="whm.lily-blood.suggestion.why">
						<Plural value={this._missedBloodLilies} one="# blood lily" other="# blood lilies" /> did not bloom due to early lily use.
					</Trans>
				</Fragment>,
			}))
		}
	}

	/**
	 * Calculates the number of lilies the user should currently have.
	 *
	 * Because lilies are generated every 30 seconds, and we don't want to
	 * be constantly checking, we run a while loop every time the event is
	 * more recent than when we should have gained a lily to catch up on our
	 * lily generation.
	 *
	 * @param {*} event
	 */
	_calculateLilies(event) {
		if (this._lastGained === 0) { this._lastGained = this.parser.fight.start_time }

		const delta = event.timestamp - this._lastGained
		const newLilies = Math.floor(delta / LILY_INTERVAL)
		this._lastGained += newLilies * LILY_INTERVAL

		this._lilies = Math.min(MAX_LILIES, this._lilies + newLilies)
		this._totalLilies += newLilies
		if (this._lilies + newLilies > MAX_LILIES) {
			this._unusedLilies += this._lilies + newLilies - MAX_LILIES
		}
	}
}
