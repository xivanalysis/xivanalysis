import {t} from '@lingui/macro'
import {ActionLink} from 'components/ui/DbLink'
import React from 'react'
import {Trans, Plural} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

export default class ThirdEye extends Module {
	static handle = 'thirdEye'
	static title = t('sam.thirdeye.title')`Third Eye`
	static dependencies = [
		'suggestions',
	]

	_thirdEyes = 0 //this is the amount of times third eye is used
	_openEyes = 0 //this is the amount of times third eye was proc'ed
	_seiganEyes = 0 //this is the amount of times they used seigan
	_badEyes = 0 //this is the amount of merciful eyes

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.MERCIFUL_EYES.id]}, this._onBadSpend)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.HISSATSU_SEIGAN.id]}, this._onSpend)
		this.addHook('cast', {by: 'player', abilityId: [ACTIONS.THIRD_EYE.id]}, this._onEye)
		this.addHook('applybuff', {
			to: 'player',
			abilityId: [STATUSES.EYES_OPEN.id]}, this._onGain)
		this.addHook('complete', this._onComplete)
	}

	_onEye() {
		this._thirdEyes += 1
	}

	_onSpend() {
		this._seiganEyes += 1 // increase usage by 1
	}

	_onBadSpend() {
		this._badEyes += 1
	}
	_onGain() {
		this._openEyes += 1 //enter the iris, increase by 1 per time a player gains the status
	}

	_onComplete() {
		const unopenedEyes = this._thirdEyes - this._openEyes
		const unspentEyes = this._openEyes - (this._badEyes + this._seiganEyes)

		if (this._thirdEyes === 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.THIRD_EYE.icon,
				content: <Trans id="sam.thirdeye.suggestion.useyourdamnthirdeye.content"> <ActionLink {...ACTIONS.THIRD_EYE}/> gives you 10% less damage taken from an incoming attack and gives you access to <ActionLink {...ACTIONS.HISSATSU_SEIGAN}/> and <ActionLink {...ACTIONS.MERCIFUL_EYES}/>. You should try to use Third Eye as much as possible to reduce the damage you take. </Trans>,

				tiers: {
					0: SEVERITY.MEDIUM,
				},
				value: this._thirdEyes,
				why: <Trans id="sam.thirdeye.suggestion.useyourdamnthirdeye.why"> You did not use third eye at all over the course of the fight. Use it on unavoidable raid wide damage at a minimum. </Trans>,

			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.THIRD_EYE.icon,
			content: <Trans id="sam.thirdeye.suggestion.unopenedeyes.content"> Avoid using <ActionLink {...ACTIONS.THIRD_EYE}/>  when its guarenteed not to proc, causing an unnecessary weave and risking the chance of it potentially being on cooldown for unavoidable damage </Trans>,

			tiers: {
				1: SEVERITY.MINOR,
				10: SEVERITY.MEDIUM,
			},
			value: unopenedEyes,
			why: <Trans id="sam.thirdeye.suggestion.unopenedeyes.why"> {unopenedEyes} of your Third Eye casts did not proc. </Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HISSATSU_SEIGAN.icon,
			content: <Trans id="sam.thirdeye.suggestion.unspenteyes.content"> Never let a proc go to waste, spend your procs from <ActionLink {...ACTIONS.THIRD_EYE}/> on <ActionLink {...ACTIONS.HISSATSU_SEIGAN}/> for a small dps gain.  </Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				10: SEVERITY.MEDIUM,
			},
			value: unspentEyes,
			why: <Trans id ="sam.thirdeye.suggestion.unspenteyes.why"> {unspentEyes} of your procs were not spent. </Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MERCIFUL_EYES.icon,
			content: <Trans id= "sam.thirdeye.suggestion.badeyes.content"> <ActionLink {...ACTIONS.MERCIFUL_EYES}/>'s heal is not worth the damage loss of not using <ActionLink {...ACTIONS.HISSATSU_SEIGAN}/>. </Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				4: SEVERITY.MEDIUM,
			},
			value: this._badEyes,
			why: <Trans id = "sam.thirdeye.suggestion.badeyes.why"> You used <ActionLink {...ACTIONS.MERCIFUL_EYES}/> <Plural value ={this._badEyes} one="# time" other="# times" /> during the fight. </Trans>,
		}))
	}
}

