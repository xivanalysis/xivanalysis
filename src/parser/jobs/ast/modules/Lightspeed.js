import {Trans, i18nMark} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
// import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const LIGHTSPEED_CAST_TIME_MOD = -2.5
// const LIGHTSPEED_LENGTH = 10000

export default class LIGHTSPEED extends Module {
	static handle = 'lightspeed'
	static i18n_id = i18nMark('ast.lightspeed.title')
	static dependencies = [
		'castTime',
		// 'suggestions',
	]
	static title = 'Lightspeed'
	static displayOrder = DISPLAY_ORDER.LIGHTSPEED

	_active = false
	_lightspeed = {}
	_history = []

	_ctIndex = null

	_missedGcds = 0

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)

		const lsBuffFilter = {
			by: 'player',
			abilityId: STATUSES.LIGHTSPEED.id,
		}
		this.addHook('applybuff', lsBuffFilter, this._onApplyLightspeed)
		this.addHook('refreshbuff', lsBuffFilter, this._onRefreshLightspeed)
		this.addHook('removebuff', lsBuffFilter, this._onRemoveLightspeed)

		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		// If it's a LIGHTSPEED cast, start tracking
		if (actionId === ACTIONS.LIGHTSPEED.id) {
			this._startLightspeed(event.timestamp)
		}

		// Only going to save casts during LIGHTSPEED
		if (!this._active || getAction(actionId).autoAttack) {
			return
		}

		// Save the event to the LIGHTSPEED casts
		this._lightspeed.casts.push(event)
	}

	_onApplyLightspeed(event) {
		// If we're not active at this point, they started the fight with LIGHTSPEED up. Clean up the mess.
		if (this._active) { return }
		this._startLightspeed(event.timestamp)
	}

	_onRefreshLightspeed() {
		if (!this._active) { return }
		this._lightspeed.extended = true
	}

	_onRemoveLightspeed() {
		this._stopAndSave()
	}

	_onComplete() {
		// Clean up any existing casts
		if (this._active) {
			this._stopAndSave()
		}

	}

	_startLightspeed(start) {
		this._active = true
		this._lightspeed = {
			start,
			end: null,
			extended: false,
			casts: [],
		}

		this._ctIndex = this.castTime.set('all', LIGHTSPEED_CAST_TIME_MOD)
	}

	_stopAndSave(endTime = this.parser.currentTimestamp) {
		// Make sure we've not already stopped this one
		if (!this._active) {
			return
		}

		this._active = false
		this._lightspeed.end = endTime

		this._history.push(this._lightspeed)

		this.castTime.reset(this._ctIndex)

	}

	activeAt(time) {
		// If it's during the current one, easy way out
		if (this._active && this._lightspeed.start <= time) {
			return true
		}

		return this._history.some(lightspeed => lightspeed.start <= time && lightspeed.end >= time)
	}

	output() {
		const noCastsMessage = <Fragment>
			<p>
				<span className="text-error"><Trans id="ast.lightspeed.messages.no-casts">Zero casts recorded for <ActionLink {...ACTIONS.LIGHTSPEED} /></Trans></span>
			</p>
		</Fragment>

		const panels = this._history.map(lightspeed => {
			const numGcds = lightspeed.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			const mpSavings = lightspeed.casts
				.filter(cast => getAction(cast.ability.guid).onGcd)
				.reduce((totalSavings, cast) => getAction(cast.ability.guid).mpCost / 2 + totalSavings, 0)
			// TODO: Use mpCostFactor instead of mpCost to be level agnostic

			return {
				key: lightspeed.start,
				title: {
					content: <>
						{this.parser.formatTimestamp(lightspeed.start)}
						&nbsp;-&nbsp;{numGcds} GCDs
						&nbsp;-&nbsp;{mpSavings} MP saved
						{lightspeed.extended && <span className="text-info">&nbsp;(extended)</span>}
					</>,
				},
				content: {
					content: <Rotation events={lightspeed.casts}/>,
				},
			}
		})

		const lightspeedDisplay = <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>

		return <Fragment>
			<p>
				<Trans id="ast.lightspeed.messages.explanation">
				Some of the applications of <ActionLink {...ACTIONS.LIGHTSPEED} /> include MP savings on heavy healing segments, keeping casts up while on the move and for weaving OGCDs.
				To further complicate usage, <ActionLink {...ACTIONS.ESSENTIAL_DIGNITY} /> can reduce the cooldown, and the buff can be extended by <ActionLink {...ACTIONS.CELESTIAL_OPPOSITION} />.<br/><br/>
				At this point of time it's difficult to identify what is optimal, since each fight calls for a different strategy.
				</Trans>
			</p>
			{panels.length === 0 && noCastsMessage}
			{panels.length > 0 && lightspeedDisplay}

		</Fragment>
	}
}
