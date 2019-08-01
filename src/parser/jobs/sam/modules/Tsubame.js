import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
//import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const TSUBAME_COOLDOWN = 60

export default class Tsubame  extends Module {
        static handle = 'tsubame'
        static title = t('sam.tsubame.title')`Tsubame`
	static dependencies = [
		'suggestions',
	]

	_kaeshiFailures = 0 //amount of bad kaeshi moves
	_kaeshiMidare = 0 //amount of times kaeshi was a double midare

	//Stuff for caveman level drift checking

	_previousTsubame = 0 //this holds the start time of the last Tsubame, if first Tsubame this will be 0
	_totalDrift = 0 //this will track the total drift over time of Tsubame

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.KAESHI_HIGANBANA.id, ACTIONS.KAESHI_GOKEN.id]}, this._onBadTsubame,)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.KAESHI_SETSUGEKKA.id]}, this._onDoubleMidare,)
		this.addHook('complete', this._onComplete,)
	}

	_tsubameDrift(event) {
		//Drift check!
		//Step 1: save the current timestamp for the current Tsubame

		const currentTsubame = event.timestamp

		//Step 2: compare to old timestamp for the difference between the 2.

		if (this._previousTsubame !== 0) {
			this._totalDrift += ((currentTsubame - this._previousTsubame)/1000) - TSUBAME_COOLDOWN
		}

		//step 3: move current timestamp to old Tsubame

		this._previousTsubame = event.timestamp
	}

	_onBadTsubame(event) {
		this._kaeshiFailures += 1
		this._tsubameDrift(event)
	}

	_onDoubleMidare(event) {
		this._kaeshiMidare += 1
		this._tsubameDrift(event)
	}

	_onComplete() {
		const totalUses = this._kaeshiFailures + this._kaeshiMidare
		const badUses = this._kaeshiFailures

		//Tsubame use check calcs
		const fightDuration = (this.parser.fightDuration/1000)
		const expectedTsubame = (Math.floor(fightDuration/ TSUBAME_COOLDOWN) + 1)
		const missedTsubame = Math.floor(expectedTsubame - totalUses)
		const drift = this._totalDrift.toFixed(0)

		if (totalUses === 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.TSUBAME_GAESHI.icon,
				content: <Trans id="sam.tsubame.suggestion.notsubame.content"> <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> allows you to repeat your Iaijustu skills right after you use them. To not use this skill is to deny yourself 2 <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/> for the price of one. </Trans>,
				severity: SEVERITY.MAJOR,
				why: <Trans id= "sam.tsubame.suggestion.notsubame.why"> You did not use <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> at all. </Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TSUBAME_GAESHI.icon,
			content: <Trans id="sam.tsubame.suggestion.badtsubame.content"> You used <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> incorrectly. The skill should only be used to get more <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/>. </Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			why: <Trans id="sam.tsubame.suggestion.badtsubame.why"> You used <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> on the wrong sen skills {badUses} times over the course of the fight </Trans>,
			value: this._badUses,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.TSUBAME_GAESHI.icon,
			content: <Trans id="sam.tsubame.suggestions.uses.content"> Make sure you use as many <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> over the course of the fight as possible, this skill allows you to get a extra <ActionLink {...ACTIONS.MIDARE_SETSUGEKKA}/> every minute. </Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: missedTsubame,
			why: <Trans id="sam.tsubame.suggestions.uses.why"> You missed <Plural value ={missedTsubame} one = "# use" other= "# uses" /> of <ActionLink {...ACTIONS.TSUBAME_GAESHI}/>. </Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.LIVING_DEAD.icon,
			content: <Trans id="sam.tsubame.suggestions.drift.content"> You should aim to minimize the amount of drift between uses of  <ActionLink {...ACTIONS.TSUBAME_GAESHI}/>, this skill should be used on cooldown as much as possible. </Trans>,
			tiers: {
				10: SEVERITY.MINOR,
				30: SEVERITY.MEDIUM,
				60: SEVERITY.MAJOR,
			},
			value: drift,
			why: <Trans id="sam.tsubame.suggestions.drift.why"> You had {drift} extra seconds between uses of <ActionLink {...ACTIONS.TSUBAME_GAESHI}/> over the course of the fight. </Trans>,
		}))
	}

}
