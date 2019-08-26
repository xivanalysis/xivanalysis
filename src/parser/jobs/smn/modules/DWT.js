import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const CORRECT_GCDS = [
	ACTIONS.RUIN_III.id,
	ACTIONS.OUTBURST.id,
]

const DWT_CAST_TIME_MOD = -2.5

export const DWT_LENGTH = 15000
const OGCD_LENGTH = 750
// Taking off three ogcd lengths - DWT to open, the final R3, and DF to close
// eslint-disable-next-line no-magic-numbers
const USABLE_LENGTH = DWT_LENGTH - OGCD_LENGTH * 3

// Suggestion severity
const BAD_GCD_SEVERITY = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	6: SEVERITY.MAJOR,
}

const MISSED_GCD_SEVERITY = {
	1: SEVERITY.MINOR,
	10: SEVERITY.MEDIUM,
}

export default class DWT extends Module {
	static handle = 'dwt'
	static dependencies = [
		// Ensure AoE runs cleanup before us
		'aoe', // eslint-disable-line @xivanalysis/no-unused-dependencies
		'castTime',
		'downtime',
		'gauge',
		'gcd',
		'suggestions',
	]
	static title = t('smn.dwt.title')`Dreadwyrm Trance`
	static displayOrder = DISPLAY_ORDER.DWT

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

		const dwtBuffFilter = {
			by: 'player',
			abilityId: STATUSES.DREADWYRM_TRANCE.id,
		}
		this.addHook('applybuff', dwtBuffFilter, this._onApplyDwt)
		this.addHook('removebuff', dwtBuffFilter, this._onRemoveDwt)

		this.addHook('death', {to: 'player'}, () => {
			if (!this._active) { return }
			this._dwt.died = true
		})

		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		// If it's a DWT cast, start tracking
		if (actionId === ACTIONS.DREADWYRM_TRANCE.id) {
			this._startDwt(event.timestamp)
		}

		// Only going to save casts during DWT
		const action = getDataBy(ACTIONS, 'id', actionId)
		if (!this._active || !action || action.autoAttack) {
			return
		}

		// Save the event to the DWT casts
		this._dwt.casts.push(event)
	}

	_onDeathflareDamage(event) {
		this._stopAndSave(event.hits.length, event.timestamp)
	}

	_onApplyDwt(event) {
		// If we're not active at this point, they started the fight with DWT up. Clean up the mess.
		if (this._active) { return }
		this._startDwt(event.timestamp)
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
				.filter(cast => {
					const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
					return action && action.onGcd && !CORRECT_GCDS.includes(action.id)
				})
				.length
		})

		// Suggestions
		if (badGcds) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.DREADWYRM_TRANCE.icon,
				content: <Trans id="smn.dwt.suggestions.bad-gcds.content">
					GCDs used during Dreadwyrm Trance should be limited to <ActionLink {...ACTIONS.RUIN_III}/> in single target or <ActionLink {...ACTIONS.OUTBURST}/> in AoE situations.
				</Trans>,
				why: <Trans id="smn.dwt.suggestions.bad-gcds.why">
					{badGcds} incorrect GCDs used during DWT.
				</Trans>,
				tiers: BAD_GCD_SEVERITY,
				value: badGcds,
			}))
		}

		if (this._missedGcds) {
			// Grabbing the full possible gcd count for suggestion text
			const possibleGcds = Math.floor(USABLE_LENGTH / this.gcd.getEstimate()) + 1

			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DREADWYRM_TRANCE.icon,
				content: <Trans id="smn.dwt.suggestions.missed-gcds.content">
					You can fit <strong>{possibleGcds}</strong> GCDs in each <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/> at your GCD. In general, don't end DWT early. Exceptions include: the boss is about to become invulnerable/die or <ActionLink {...ACTIONS.DEATHFLARE}/> will cleave multiple targets.
				</Trans>,
				why: <Trans id="smn.dwt.suggestions.missed-gcds.why">
					{this._missedGcds} additional GCDs could have been used during DWT.
				</Trans>,
				tiers: MISSED_GCD_SEVERITY,
				value: this._missedGcds,
			}))
		}

		if (this._missedDeathflares) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DEATHFLARE.icon,
				content: <Trans id="smn.dwt.suggestions.missed-deathflares.content">
					Make sure you always end <ActionLink {...ACTIONS.DREADWYRM_TRANCE}/> with a <ActionLink {...ACTIONS.DEATHFLARE}/>. Failing to do so is a huge damage loss.
				</Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id="smn.dwt.suggestions.missed-deathflares.why">
					{this._missedDeathflares} DWTs with no Deathflare.
				</Trans>,
			}))
		}
	}

	_startDwt(start) {
		this._active = true
		this._dwt = {
			start,
			end: null,
			rushing: this.gauge.isRushing(),
			died: false,
			casts: [],
		}

		this._ctIndex = this.castTime.set('all', DWT_CAST_TIME_MOD)
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
		// Don't flag if they died, the death suggestion is morbid enough.
		if (dfHits === 0 && !this._dwt.died) {
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
		const gcds = this._dwt.casts.filter(cast => {
			const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
			return action && action.onGcd
		})

		// Eyy, got there. Save out the details for now.
		this._missedGcds += Math.max(0, possibleGcds - gcds.length)
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
			const numGcds = dwt.casts.filter(cast => {
				const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
				return action && action.onGcd
			}).length
			const noDeathflare = dwt.casts.filter(cast => cast.ability.guid === ACTIONS.DEATHFLARE.id).length === 0
			return {
				key: dwt.start,
				title: {
					content: <>
						{this.parser.formatTimestamp(dwt.start)}
						&nbsp;-&nbsp;{numGcds} GCDs
						{dwt.rushing && <>
							&nbsp;<Trans id="smn.dwt.rushing" render="span" className="text-info">(rushing)</Trans>
						</>}
						{noDeathflare && !dwt.died && <>
							&nbsp;<Trans id="smn.dwt.no-deathflare" render="span" className="text-error">(no Deathflare)</Trans>
						</>}
						{dwt.died && <>
							&nbsp;<Trans id="smn.dwt.died" render="span" className="text-error">(died)</Trans>
						</>}
					</>,
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
