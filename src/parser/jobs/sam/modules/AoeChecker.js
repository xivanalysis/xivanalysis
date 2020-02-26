import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

//All sets contain AoE moves to be checked, grouped by type (GCD, SEN, KENKI)
const AOE_GCDS = new Set([ACTIONS.FUGA.id, ACTIONS.OKA.id, ACTIONS.MANGETSU.id])
const AOE_SENS = new Set([ACTIONS.TENKA_GOKEN.id, ACTIONS.KAESHI_GOKEN.id])
const AOE_KENKI = new Set([ACTIONS.HISSATSU_KYUTEN.id, ACTIONS.HISSATSU_GUREN.id])

//These sets are based on break Points, and not type of resource used

const GAIN_AT_3 = new Set([ACTIONS.FUGA.id, ACTIONS.OKA.id, ACTIONS.MANGETSU.id, ACTIONS.HISSATSU_KYUTEN.id])
const GAIN_AT_2 = new Set([ACTIONS.HISSATSU_GUREN.id, ACTIONS.TENKA_GOKEN.id, ACTIONS.KAESHI_GOKEN.id])

//saying const # don't work so screw it

const GAIN3 = 3
const GAIN2 = 2

export default class AoeChecker extends Module {
	static handle = 'aoechecker'
	static title = t('sam.aoechecker.title')`AoeChecker`
	static dependencies = [
		'suggestions',
	]

	_badAoeGCDs = 0 //amount of aoe GCDs that didn't hit their break point for a gain
	_badSenCasts = 0 //amount of Goken/Tsubame Goken that didn't hit the break point for damage gain
	_badKenkiCasts = 0 //amount of Kenki Casts that didn't break the damage gain threshold

	constructor(...args) {
		super(...args)
		this.addEventHook('normaliseddamage', {by: 'player'}, this._onAoe)
		this.addEventHook('complete', this._onComplete)
	}

	_onAoe(event) {

		const action = event.ability.guid

		//Step 1: Find break point

		if (GAIN_AT_2.has(action)) {

			//Step 2: Check break point

			if (event.hits < GAIN2) {
				//Step 3: Check type of resource used and increment

				if (AOE_GCDS.has(action)) {

					this._badAoeGCDs++
				} else if (AOE_SENS.has(action)) {

					this._badSenCasts++
				} else if (AOE_KENKI.has(action)) {

					this._badKenkiCasts++
				}
			}

		} else if (GAIN_AT_3.has(action)) {

			//Step 2: Check break point

			if (event.hits < GAIN3) {
				//Step 3: Check type of resource used and increment

				if (AOE_GCDS.has(action)) {

					this._badAoeGCDs++
				} else if (AOE_SENS.has(action)) {

					this._badSenCasts++
				} else if (AOE_KENKI.has(action)) {

					this._badKenkiCasts++
				}
			}
		}
	}

	_onComplete() {

		//SUGGESTION TIME!

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HISSATSU_GUREN.icon,
			content: <Trans id= "sam.aoechecker.suggestions.badkenki.content">
			Using aoe moves when you don't reach the target threshold for it to be a gain is a loss.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this._badKenkiCasts,
			why: <Trans id = "sam.aoechecker.suggestions.aoekenki.why">
					You misused kenki moves <Plural value ={this._badKenkiCasts} one="# time" other="# times" /> during the fight.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TENKA_GOKEN.icon,
			content: <Trans id= "sam.aoechecker.suggestions.badsen.content">
                        Using aoe moves when you don't reach the target threshold for it to be a gain is a loss.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this._badSenCasts,
			why: <Trans id = "sam.aoechecker.suggestions.badsen.why">
                                        You misused sen moves <Plural value ={this._badSenCasts} one="# time" other="# times" /> during the fight.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.FUGA.icon,
			content: <Trans id= "sam.aoechecker.suggestions.badgcd.content">
                        Using aoe moves when you don't reach the target threshold for it to be a gain is a loss.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				3: SEVERITY.MEDIUM,
				5: SEVERITY.MAJOR,
			},
			value: this._badAoeGCDs,
			why: <Trans id = "sam.aoechecker.suggestions.badgcd.why">
                                        You misused aoe GCDs <Plural value ={this._badAoeGCDs} one="# time" other="# times" /> during the fight.
			</Trans>,
		}))

	}
}

