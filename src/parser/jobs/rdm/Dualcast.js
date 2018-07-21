import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'
import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {CAST_TYPE, CORRECT_GCDS} from 'parser/jobs/rdm/DualCastEnums'

//const util = require('util')

export default class DualCast extends Module {
	static handle = 'dualCast'
	static dependencies = [
		'aoe',
		'castTime',
		'downtime',
		'gauge',
		'gcd',
		'suggestions',
	]
	static title = 'DualCast'
	//Default CastState
	_castType = CAST_TYPE.HardCast
	//Used to 0 out CastTimes
	_ctIndex = null
	//Specifies if the buff has been used this cast
	_usedCast = false
	//Array of historical casts to do metrics against
	_history = []
	//Faded without being used
	_missedDualCasts = 0
	//Used on anything other than Verthunder/Verareo/Verraise
	_wastedDualCasts = 0

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('applybuff', {
			to: 'player',
			abilityId: STATUSES.DUALCAST.id,
		}, this._onGain)
		this.addHook('removebuff', {
			to: 'player',
			abilityId: STATUSES.DUALCAST.id,
		}, this._onRemove)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityID = event.ability.guid
		const castTime = getAction(abilityID).castTime
		if (castTime > 0 && this._castType === CAST_TYPE.DualCast) {
			this._ctIndex = this.castTime.set('all', 0)
			if (!CORRECT_GCDS.includes(abilityID)) {
				this._wastedDualCasts += 1
				const casts = {
					id: abilityID,
					timestamp: event.timestamp,
					name: event.ability.name,
					casttype: this._castType,
					events: [],
				}
				casts.events.push(event)
				this._history.push(casts)
			}

			this._usedCast = true
		}
	}

	_onGain() {
		this._castType = CAST_TYPE.DualCast
		this._usedCast = false
	}

	_onRemove() {
		if (!this._usedCast) {
			this._missedDualCasts += 1
		}

		this._castType = CAST_TYPE.HardCast
		this.castTime.reset(this._ctIndex)
		this._ctIndex = null
	}

	_onComplete() {
		if (this._castType === CAST_TYPE.DualCast) {
			this._castType = CAST_TYPE.HardCast
		}

		//Process Wasted DualCasts
		if (this._wastedDualCasts) {
			this.suggestions.add(new Suggestion({
				icon: STATUSES.DUALCAST.icon,
				why: `${this._wastedDualCasts} DualCasts were wasted on low cast-time spells.`,
				severity: this._wastedDualCasts > 5 ? SEVERITY.MAJOR : this._wastedDualCasts > 1? SEVERITY.MEDIUM : SEVERITY.MINOR,
				content: <Fragment>
					Spells used while DualCast is up should be limited to <ActionLink {...ACTIONS.VERAREO}/>, <ActionLink {...ACTIONS.VERTHUNDER}/>, or <ActionLink {...ACTIONS.VERRAISE}/>
				</Fragment>,
			}))
		}

		//Process Missed DualCasts
		if (this._missedDualCasts) {
			this.suggestions.add(new Suggestion({
				icon: STATUSES.DUALCAST.icon,
				why: `${this._missedDualCasts} DualCasts were Lost due to not casting.`,
				severity: this._missedDualCasts > 5 ? SEVERITY.MAJOR : this._missedDualCasts > 1? SEVERITY.MEDIUM : SEVERITY.MINOR,
				content: <Fragment>
					You should avoid wasting DualCast procs entirely as it is lost potency overtime.
				</Fragment>,
			}))
		}
	}

	output() {
		if (this._history.length === 0) {
			return false
		}

		const panels = this._history.map(casts => {
			//console.log(util.inspect(casts, {showHidden: true, depth: null}))
			return {
				key: casts.timestamp,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(casts.timestamp)}
						&nbsp;-&nbsp;{casts.name}
					</Fragment>,
				},
				content: {
					content: <Rotation events={casts.events}/>,
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
