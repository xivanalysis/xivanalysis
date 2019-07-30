import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

//All Gcds that consume the buff and are bad are in Bad Meikyo Casts, Duh. Does not check sen spending moves
const BAD_MEIKYO_GCDS = new Set([ACTIONS.HAKAZE.id, ACTIONS.JINPU.id, ACTIONS.ENPI.id, ACTIONS.SHIFU.id, ACTIONS.FUGA.id, ACTIONS.MANGETSU.id, ACTIONS.OKA.id])
const GOOD_MEIKYO_GCDS = new Set([ACTIONS.GEKKO.id, ACTIONS.KASHA.id, ACTIONS.YUKIKAZE.id])
const MAX_MEIKYO_GCDS = 3
const MEIKYO_COOLDOWN = 60

export default class Meikyo extends Module {
	static handle = 'meikyo'
	static title = t('sam.meikyo.title')`Meikyo`
	static dependencies = [
		'combatants',
		'suggestions',
	]

	_currentMeikyoCasts = 0 //keep track of total casts under current buff window
	_missedMeikyoCasts = 0 // Missed = missed + (3 - current)
	_badMeikyoCasts = 0 // Non-combo finishers increase

	_totalMeikyoBuffs = 0 //keeps track of the amount of times the skill is cast

	//Stuff for caveman level drift checking

	_previousMeikyo = 0 //this holds the start time of the last meikyo, if first meikyo this will be 0
	_totalDrift = 0 //this will track the total drift over time of meikyo

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.MEIKYO_SHISUI.id}, this._onRemoveMS)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid

		if (abilityId === ACTIONS.MEIKYO_SHISUI.id) {
			this._currentMeikyoCasts = 0
			this._totalMeikyoBuffs++

			//Drift check!
			//Step 1: save the current timestamp for the current meikyo

			const currentMeikyo = event.timestamp

			//Step 2: compare to old timestamp for the difference between the 2.

			if (this._previousMeikyo !== 0) {
				this._totalDrift += ((currentMeikyo - this._previousMeikyo)/1000) - MEIKYO_COOLDOWN
			}

			//step 3: move current timestamp to old Meikyo and reset current timestamp just to be safe

			this._previousMeikyo = event.timestamp

		}

		if (this.combatants.selected.hasStatus(STATUSES.MEIKYO_SHISUI.id)) {
			if (BAD_MEIKYO_GCDS.has(abilityId)) {
				this._badMeikyoCasts++
				this._currentMeikyoCasts++
			}
			if (GOOD_MEIKYO_GCDS.has(abilityId)) {
				this._currentMeikyoCasts++
			}
		}

	}

	_onRemoveMS() {
		this._missedMeikyoCasts += (MAX_MEIKYO_GCDS - this._currentMeikyoCasts)
	}

	_onComplete() {

		//meikyo use check calcs
		const fightDuration = (this.parser.fightDuration/1000)
		const expectedMeikyo = (Math.floor(fightDuration/ MEIKYO_COOLDOWN) + 1)
		const missedMeikyo = Math.floor(expectedMeikyo - this._totalMeikyoBuffs)
		const drift = this._totalDrift.toFixed(0)

		//SUGGESTION TIME!

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MEIKYO_SHISUI.icon,
			content: <Trans id= "sam.meikyo.suggestions.badmeikyo.content">
				While under the effects of  <ActionLink {...ACTIONS.MEIKYO_SHISUI}/> you should only use <ActionLink {...ACTIONS.GEKKO}/>, <ActionLink {...ACTIONS.KASHA}/>, and <ActionLink {...ACTIONS.YUKIKAZE}/> - these actions allow you to gather Sens faster.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this._badMeikyoCasts,
			why: <Trans id = "sam.meikyo.suggestions.badmeikyo.why">
					You did not use sen moves <Plural value ={this._badMeikyoCasts} one="# time" other="# times" /> under the effect of <ActionLink {...ACTIONS.MEIKYO_SHISUI}/>.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MEIKYO_SHISUI.icon,
			content: <Trans id="sam.meikyo.suggestions.missedmeikyo.content">
                                Always make sure to get {MAX_MEIKYO_GCDS} GCDs under the effect of <ActionLink {...ACTIONS.MEIKYO_SHISUI}/>.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: this._missedMeikyoCasts,
			why: <Trans id= "sam.meikyo.suggestions.missedmeikyo.why">
                                        You missed <Plural value={this._missedMeikyoCasts} one="# GCD" other= "# GCDs" /> under the effect of <ActionLink {...ACTIONS.MEIKYO_SHISUI}/>.
			</Trans>,
		}))

		if (this._totalMeikyoBuffs === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.MEIKYO_SHISUI.icon,
				content: <Trans id="sam.meikyo.suggestions.deleteyourself.content"> <ActionLink {...ACTIONS.MEIKYO_SHISUI}/> is a tool used to speed up your sen generation and pump out more <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/> over the course of the fight. Not using this skill will serverly lower your damage output. </Trans>,
				severity: SEVERITY.MAJOR, //I wish I could set this as morbid
				why: <Trans id="sam.meikyo.suggestions.deleteyourself.why"> You never used <ActionLink {...ACTIONS.MEIKYO_SHISUI}/> at all during the fight. </Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MEIKYO_SHISUI.icon,
			content: <Trans id="sam.meikyo.suggestions.uses.content"> Make sure you use as many <ActionLink {...ACTIONS.MEIKYO_SHISUI}/> over the course of the fight as possible, this skill allows you to speed up the sen build required to use <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/>. </Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: missedMeikyo,
			why: <Trans id="sam.meikyo.suggestions.uses.why"> You missed <Plural value ={missedMeikyo} one = "# use" other= "# uses" /> of <ActionLink {...ACTIONS.MEIKYO_SHISUI}/>. </Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.LIVING_DEAD.icon,
			content: <Trans id="sam.meikyo.suggestions.drift.content"> You should aim to minimize the amount of drift between uses of  <ActionLink {...ACTIONS.MEIKYO_SHISUI}/>, this skill should be used on cooldown as much as possible. </Trans>,
			tiers: {
				10: SEVERITY.MINOR,
				30: SEVERITY.MEDIUM,
				60: SEVERITY.MAJOR,
			},
			value: drift,
			why: <Trans id="sam.meikyo.suggestions.drift.why"> You had {drift} extra seconds between uses of <ActionLink {...ACTIONS.MEIKYO_SHISUI}/> over the course of the fight. </Trans>,
		}))

	}
}
