import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

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
	_active = false
	_ctIndex = null
	_usedCast = false
	_casts = {}
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
		//const castTime = event.ability.castTime
		const abilityID = event.ability.guid
		const castTime = getAction(abilityID).castTime
		//const util = require('util')
		//console.log(util.inspect(event, {showHidden: true, depth: null}))
		//console.log(`Ability: ${event.ability.name} Casttime: ${castTime} isActive? ${this._active}`)

		if (castTime > 0 && this._active) {
			this._ctIndex = this.castTime.set('all', 0)

			if (abilityID !== ACTIONS.VERTHUNDER.id &&
				abilityID !== ACTIONS.VERAREO.id &&
				abilityID !== ACTIONS.VERRAISE.id) {
				this._wastedDualCasts += 1
				this._casts = {
					casts: [],
				}

				this._casts.casts.push(event)
				this._history.push(this._casts)
			} else {
				// const util = require('util')
				// console.log(util.inspect(this._history, {showHidden: true, depth: null}))
			}

			this._usedCast = true
		}
	}

	_onGain() {
		//console.log('Gained Buff!')
		this._active = true
		this._usedCast = false
	}

	_onRemove() {
		console.log('Removed Buff!')
		if (!this._usedCast) {
			this._missedDualCasts += 1
		}

		this._active = false
		this.castTime.reset(this._ctIndex)
		this._ctIndex = null
	}

	_onComplete() {
		console.log('DualCast Complete')
		if (this._active) {
			this._active = false
		}

		// this._wastedDualCasts = 10
		// this._missedDualCasts = 20
		// const util = require('util')
		// console.log(util.inspect(this._history, {showHidden: true, depth: null}))

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
					Spells used while DualCast is up should be limited to <ActionLink {...ACTIONS.VERAREO}/>, <ActionLink {...ACTIONS.VERTHUNDER}/>, or <ActionLink {...ACTIONS.VERRAISE}/>
				</Fragment>,
			}))
		}
	}

	output() {
		const panels = this._history.map(casts => {
			const numGcds = casts.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			const name = casts.casts.filter(cast => getAction(cast.ability.guid).onGcd).name
			//console.log(`Number Of GCDs: ${numGcds}`)
			//const util = require('util')
			//console.log(util.inspect(cast, {showHidden: true, depth: null}))
			return {
				key: name,
				title: {
					content: <Fragment>
						{numGcds} GCDs
					</Fragment>,
				},
				content: {
					content: <Rotation events={casts.casts}/>,
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
