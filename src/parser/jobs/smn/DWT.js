import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const CORRECT_GCDS = [
	ACTIONS.RUIN_III.id,
	ACTIONS.RUIN_IV.id,
	ACTIONS.TRI_BIND.id,
]

const DWT_LENGTH = 16000
const OGCD_LENGTH = 750
// Taking off three ogcd lengths - DWT to open, the final R3, and DF to close
const USABLE_LENGTH = DWT_LENGTH - OGCD_LENGTH * 3

export default class DWT extends Module {
	static handle = 'dwt'
	static dependencies = [
		'aoe', // Ensure AoE runs cleanup before us
		'castTime',
		'downtime',
		'gauge',
		'gcd',
		'suggestions',
	]
	static title = 'Dreadwyrm Trance'

	_active = false
	_dwt = {}
	_history = []

	_ctIndex = null

	_missedGcds = 0
	_missedDeathflares = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('aoedamage', {
			by: 'player',
			abilityId: ACTIONS.DEATHFLARE.id,
		}, this._onDeathflareDamage)
		this.addHook('removebuff', {
			by: 'player',
			abilityId: STATUSES.DREADWYRM_TRANCE.id,
		}, this._onRemoveDwt)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		// If it's a DWT cast, start tracking
		if (actionId === ACTIONS.DREADWYRM_TRANCE.id) {
			this._active = true
			this._dwt = {
				start: event.timestamp,
				end: null,
				rushing: this.gauge.isRushing(),
				casts: [],
			}

			this._ctIndex = this.castTime.set([ACTIONS.RUIN_III.id], 0)
		}

		// Only going to save casts during DWT
		if (!this._active || getAction(actionId).autoAttack) {
			return
		}

		// Save the event to the DWT casts
		this._dwt.casts.push(event)
	}

	_onDeathflareDamage(event) {
		this._stopAndSave(event.hits.length, event.timestamp)
	}

	_onRemoveDwt() {
		// Only save if there's no DF - the aoedamage will handle DWTs w/ DF (hopefully all of them lmao)
		if (!this._dwt.casts.some(cast => cast.ability.guid === ACTIONS.DEATHFLARE.id)) {
			this._stopAndSave(0)
		}
	}

	_onComplete() {
		// Clean up any existing casts
		if (this._active) {
			this._stopAndSave(0)
		}

		// Run some analytics for suggestions
		let badGcds = 0
		this._history.forEach(dwt => {
			badGcds += dwt.casts
				.filter(cast =>
					getAction(cast.ability.guid).onGcd &&
					!CORRECT_GCDS.includes(cast.ability.guid)
				)
				.length
		})

		// Suggestions
		if (badGcds) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DREADWYRM_TRANCE.icon,
				why: `${badGcds} incorrect GCDs used during DWT.`,
				severity: badGcds > 5 ? SEVERITY.MAJOR : badGcds > 1? SEVERITY.MEDIUM : SEVERITY.MINOR,
				content: <Fragment>
					GCDs used during Dreadwyrm Trance should be limited to <ActionLink {...ACTIONS.RUIN_III}/> and <ActionLink {...ACTIONS.RUIN_IV}/>, or <ActionLink {...ACTIONS.TRI_BIND}/> in AoE situations.
				</Fragment>,
			}))
		}

		if (this._missedGcds) {
			// Grabbing the full possible gcd count for suggestion text
			const possibleGcds = Math.floor(USABLE_LENGTH / this.gcd.getEstimate()) + 1

			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DREADWYRM_TRANCE.icon,
				content: <Fragment>
					You can fit <strong>{possibleGcds}</strong> GCDs in each <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/> at your GCD. In general, don't end DWT early. Exceptions include: the boss is about to become invulnerable/die, <ActionLink {...ACTIONS.AETHERFLOW}/> is ready, or <ActionLink {...ACTIONS.DEATHFLARE}/> will cleave multiple targets.
				</Fragment>,
				severity: this._missedGcds < 10? SEVERITY.MINOR : SEVERITY.MEDIUM,
				why: `${this._missedGcds} additional GCDs could have been used during DWT.`,
			}))
		}

		if (this._missedDeathflares) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DEATHFLARE.icon,
				content: <Fragment>
					Make sure you always end <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/> with a <ActionLink {...ACTIONS.DEATHFLARE}/>. Failing to do so is a huge damage loss.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: `${this._missedDeathflares} DWTs with no Deathflare.`,
			}))
		}
	}

	_stopAndSave(dfHits, endTime = this.parser.currentTimestamp) {
		// Make sure we've not already stopped this one
		if (!this._active) {
			return
		}

		this._active = false
		this._dwt.end = endTime
		this._history.push(this._dwt)

		this.castTime.reset(this._ctIndex)

		// ...don't miss deathflare k
		if (dfHits === 0) {
			this._missedDeathflares ++
		}

		// If they're rushing, don't fault them for short DWTs
		// Even a single additional hit makes a 0-gcd dwt worth it :eyes:
		if (this.gauge.isRushing() || dfHits > 1) {
			return
		}

		// Don't want to fault people for 'missing' gcds when they can't actually cast
		const invulnTime = this.downtime.getDowntime(this._dwt.start, this._dwt.start + DWT_LENGTH)

		// The last gcd only needs to fit the instant cast in, hence the +1
		const possibleGcds = Math.floor((USABLE_LENGTH - invulnTime) / this.gcd.getEstimate()) + 1

		// Check the no. GCDs actually cast
		const gcds = this._dwt.casts.filter(cast => getAction(cast.ability.guid).onGcd)

		// Eyy, got there. Save out the details for now.
		this._missedGcds += possibleGcds - gcds.length
	}

	activeAt(time) {
		// If it's during the current one, easy way out
		if (this._active && this._dwt.start <= time) {
			return true
		}

		return this._history.some(dwt => dwt.start <= time && dwt.end >= time)
	}

	output() {
		const panels = this._history.map(dwt => {
			const numGcds = dwt.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			return {
				key: dwt.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(dwt.start)}
						&nbsp;-&nbsp;{numGcds} GCDs
						{dwt.rushing && <span className="text-info">&nbsp;(rushing)</span>}
					</Fragment>,
				},
				content: {
					content: <Rotation events={dwt.casts}/>,
				},
			}
		})

		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}
}
