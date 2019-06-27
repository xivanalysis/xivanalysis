import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {CAST_TYPE, CORRECT_GCDS} from 'parser/jobs/rdm/modules/DualCastEnums'

//const util = require('util')

export default class DualCast extends Module {
	static handle = 'dualCast'
	static dependencies = [
		'castTime',
		'downtime',
		'suggestions',
	]
	static title = t('rdm.dualcast.title')`Dualcast`
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
	//The last timestamp for a change in CastType
	_castTypeLastChanged = null
	_severityMissedDualcast = {
		1: SEVERITY.MINOR,
		2: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	}
	_severityWastedDualcast = {
		1: SEVERITY.MINOR,
		3: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	}

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
		//TODO: Handle HardCast opener for thunder/areo properly
		//TODO: Scatter and target counts?
		const abilityID = event.ability.guid
		const action = getDataBy(ACTIONS, 'id', abilityID)
		const castTime = action? action.castTime : 0
		const invuln = this.downtime.getDowntime(this._castTypeLastChanged||0, event.timestamp)
		//console.log('Invuln:' + invuln)
		//console.log(`Cast: ${event.ability.name}, timestamp: ${this.parser.formatTimestamp(event.timestamp)}`)
		if (castTime > 0 && this._castType === CAST_TYPE.DualCast) {
			this._ctIndex = this.castTime.set('all', 0)
			if (!CORRECT_GCDS.includes(abilityID) && invuln === 0) {
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

	_onGain(event) {
		this._castType = CAST_TYPE.DualCast
		this._usedCast = false
		this._castTypeLastChanged = event.timestamp
	}

	_onRemove(event) {
		if (!this._usedCast) {
			const invuln = this.downtime.getDowntime(this._castTypeLastChanged||0, event.timestamp)
			if (invuln === 0) {
				this._missedDualCasts += 1
			}
		}

		this._castType = CAST_TYPE.HardCast
		if (this._ctIndex != null) {
			this.castTime.reset(this._ctIndex)
		}
		this._ctIndex = null
		this._castTypeLastChanged = event.timestamp
	}

	_onComplete() {
		if (this._castType === CAST_TYPE.DualCast) {
			this._castType = CAST_TYPE.HardCast
		}

		//Process Wasted DualCasts
		if (this._wastedDualCasts) {
			this.suggestions.add(new TieredSuggestion({
				icon: STATUSES.DUALCAST.icon,
				content: <Trans id="rdm.dualcast.suggestions.wasted.content">
					Spells used while <StatusLink {...STATUSES.DUALCAST}/> is up should be limited to <ActionLink {...ACTIONS.VERAERO}/>, <ActionLink {...ACTIONS.VERTHUNDER}/>, or <ActionLink {...ACTIONS.VERRAISE}/>
				</Trans>,
				tiers: this._severityWastedDualcast,
				value: this._wastedDualCasts,
				why: <Trans id="rdm.dualcast.suggestions.wasted.why">{this._wastedDualCasts} <Plural value={this._wastedDualCasts} one="Dualcast was" other="Dualcasts were" /> wasted on low cast-time spells.</Trans>,
			}))
		}

		//Process Missed DualCasts
		if (this._missedDualCasts) {
			this.suggestions.add(new TieredSuggestion({
				icon: STATUSES.DUALCAST.icon,
				content: <Trans id="rdm.dualcast.suggestions.missed.content">
					You should avoid wasting DualCast procs entirely as it is lost potency overtime.
				</Trans>,
				tiers: this._severityMissedDualcast,
				value: this._missedDualCasts,
				why: <Trans id="rdm.dualcast.suggestions.missed.why">{this._missedDualCasts} <Plural value={this._missedDualCasts} one="Dualcast was" other="Dualcasts were" /> lost due to not casting.</Trans>,
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
