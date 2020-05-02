import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import _ from 'lodash'
import React from 'react'

import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import kenkiIcon from './kenki.png'
import styles from './Kenki.module.css'

const MAX_KENKI = 100

const KENKI_ACTIONS = {
	// single target
	[ACTIONS.HAKAZE.id]: {cast: 5},
	[ACTIONS.JINPU.id]: {combo: 5},
	[ACTIONS.SHIFU.id]: {combo: 5},
	[ACTIONS.YUKIKAZE.id]: {combo: 10},
	[ACTIONS.GEKKO.id]: {combo: 5, positional: 5},
	[ACTIONS.KASHA.id]: {combo: 5, positional: 5},

	// aoe
	[ACTIONS.FUGA.id]: {cast: 5},
	[ACTIONS.MANGETSU.id]: {combo: 10},
	[ACTIONS.OKA.id]: {combo: 10},

	// ranged
	[ACTIONS.ENPI.id]: {cast: 10},

	// oGCD
	[ACTIONS.IKISHOTEN.id]: {cast: 50},

	// spenders
	[ACTIONS.HISSATSU_GYOTEN.id]: {cast: -10},
	[ACTIONS.HISSATSU_YATEN.id]: {cast: -10},
	[ACTIONS.HISSATSU_SEIGAN.id]: {cast: -15},
	[ACTIONS.HISSATSU_KAITEN.id]: {cast: -20},
	[ACTIONS.HISSATSU_SHINTEN.id]: {cast: -25},
	[ACTIONS.HISSATSU_KYUTEN.id]: {cast: -25},
	[ACTIONS.HISSATSU_GUREN.id]: {cast: -50}, //AOE
	[ACTIONS.HISSATSU_SENEI.id]: {cast: -50}, //Single Target
}

const KENKI_PER_MEDITATE_TICK = 10
const MEDITATE_TICK_FREQUENCY = 3000
const MAX_MEDITATE_TICKS = 5

export default class Kenki extends Module {
	static handle = 'kenki'
	static title = t('sam.kenki.title')`Kenki`
	static dependencies = [
		'suggestions',
	]

	// Kenki
	_kenki = {
		min: 0,
		max: 0,
	}
	_history = {
		min: [],
		max: [],
	}

	_wasted = {
		min: 0,
		max: 0,
		transfer: 0,
	}

	//Aoe flags

	_badGuren = 0

	constructor(...args) {
		super(...args)

		// Kenki actions
		this.addEventHook(
			['cast', 'combo'],
			{by: 'player', abilityId: Object.keys(KENKI_ACTIONS).map(Number)},
			this._onAction,
		)

		// Meditate
		const filter = {by: 'player', abilityId: STATUSES.MEDITATE.id}
		this.addEventHook('applybuff', filter, this._onApplyMeditate)
		this.addEventHook('removebuff', filter, this._onRemoveMeditate)

		// Death just flat out resets everything. Stop dying.
		this.addEventHook('death', {to: 'player'}, () => this._set(0, 0))

		// Misc
		this.addEventHook('complete', this._onComplete)
	}

	/**
	 * Modify kenki value, optionally including a potential gain
	 * @param {number} known Known gained kenki
	 * @param {number} [potential=0] Potential gained kenki
	 */
	modify(known, potential = 0) {
		const min = this._kenki.min + known
		const max = this._kenki.max + known + potential
		this._set(min, max)

		// _kenki's been clamped, anything above it is wastage
		this._wasted.min += Math.max(0, min - this._kenki.min)
		const newMaxWaste = Math.max(0, max - this._kenki.max)
		this._wasted.max += newMaxWaste
		this._wasted.transfer += newMaxWaste

		// Potential increases muddy the ability to track waste when they hit 0 - remove it from the bank
		this._wasted.transfer = Math.max(0, this._wasted.transfer - potential)

		// If the minimum went sub-0, we've reduced the possible kenki range, adjust the waste within the transfer range
		if (min < 0) {
			this._wasted.min += Math.min(this._wasted.transfer, -min)
			this._wasted.transfer = Math.max(0, this._wasted.transfer + min)
		}
	}

	_set(min, max) {
		this._kenki = {
			min: _.clamp(min, 0, MAX_KENKI),
			max: _.clamp(max, 0, MAX_KENKI),
		}

		const t = this.parser.currentTimestamp - this.parser.fight.start_time
		this._history.min.push({t, y: this._kenki.min})
		this._history.max.push({t, y: this._kenki.max})
	}

	_onAction(event) {
		const action = KENKI_ACTIONS[event.ability.guid]

		if (!action | !action[event.type]) {
			return
		}

		// We can't track positionals, so passing the positional kenki values through as a potential gain
		this.modify(action[event.type], action.positional)
	}

	_onApplyMeditate(event) {
		this.meditateStart = event.timestamp
	}

	_onRemoveMeditate(event) {
		const diff = event.timestamp - this.meditateStart

		const ticks = Math.min(Math.floor(diff / MEDITATE_TICK_FREQUENCY), MAX_MEDITATE_TICKS)

		// Ticks could occur at any point in the duration (server tick) - add an extra potential tick if they missed one so we don't under-guess
		this.modify(ticks * KENKI_PER_MEDITATE_TICK, ticks === MAX_MEDITATE_TICKS? 0 : KENKI_PER_MEDITATE_TICK)
	}

	_onComplete() {
		const {min, max} = this._wasted

		this.suggestions.add(new TieredSuggestion({
			icon: kenkiIcon,
			content: <Trans id = "sam.kenki.suggestion.content">Kenki is your primary resource, and a significant source of damage. Avoid wasting potential kenki by using it before you hit the maximum of {MAX_KENKI}.</Trans>,
			why: <Trans id= "sam.kenki.suggestion.why">You wasted between {min} and {max} kenki.</Trans>,
			value: (min + max) / 2,
			tiers: {
				5: SEVERITY.MINOR,
				20: SEVERITY.MEDIUM,
				35: SEVERITY.MAJOR,
			},
		}))
	}

	output() {
		const sam = Color(JOBS.SAMURAI.colour)

		// Disabling magic numbers for the chart, 'cus it's a chart
		/* eslint-disable no-magic-numbers */
		const data = {
			datasets: [{
				label: 'Minimum',
				data: this._history.min,
				steppedLine: true,
				fill: false,
				borderColor: 'transparent',
				pointRadius: 0,
				pointHitRadius: 10,
			}, {
				label: 'Maximum',
				data: this._history.max,
				steppedLine: true,
				backgroundColor: sam.fade(0.5).toString(),
				borderColor: sam.fade(0.2).toString(),
				fill: '-1',
				pointRadius: 0,
				pointHitRadius: 10,
			}],
		}
		/* eslint-enable no-magic-numbers */

		return <>
			<span className={styles.helpText}>
				The visible area represents possible kenki values if positionals were missed.
			</span>
			<div>
				<TimeLineChart
					data={data}
					options={{
						legend: false,
						tooltips: {
							mode: 'index',
							displayColors: false,
						},
					}}
				/>
			</div>
		</>
	}
}
