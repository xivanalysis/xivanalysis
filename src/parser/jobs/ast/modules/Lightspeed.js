import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const LIGHTSPEED_CAST_TIME_MOD = -2.5

export default class LIGHTSPEED extends Module {
	static handle = 'lightspeed'
	static dependencies = [
		'castTime',
	]
	static title = t('ast.lightspeed.title')`Lightspeed`
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
		const action = getDataBy(ACTIONS, 'id', actionId)
		if (!this._active || !action || action.autoAttack) {
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
				<span className="text-error"><Trans id="ast.lightspeed.messages.no-casts">There were no casts recorded for <ActionLink {...ACTIONS.LIGHTSPEED} /></Trans></span>
			</p>
		</Fragment>

		const panels = this._history.map(lightspeed => {
			const gcdActions = lightspeed.casts
				.map(cast => getDataBy(ACTIONS, 'id', cast.ability.guid))
				.filter(action => action && action.onGcd)
			const numGcds = gcdActions.length
			const mpSavings = gcdActions
				.reduce((totalSavings, action) => action.mpCost / 2 + totalSavings, 0)
			// TODO: Use mpCostFactor instead of mpCost to be level agnostic

			return {
				key: lightspeed.start,
				title: {
					content: <>
						{this.parser.formatTimestamp(lightspeed.start)}
						&nbsp;-&nbsp;<Trans id="ast.lightspeed.rotation.gcd"><Plural value={numGcds} one="# GCD" other="# GCDs"/></Trans>
						&nbsp;-&nbsp;{mpSavings} <Trans id="ast.lightspeed.rotation.mp-saved">MP saved</Trans>
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
				The main use of <ActionLink {...ACTIONS.LIGHTSPEED} /> should be for weaving card actions during <ActionLink {...ACTIONS.DIVINATION} /> and <ActionLink {...ACTIONS.SLEEVE_DRAW} /> windows.<br/>
                It can also be used for MP savings on heavy healing segments, keeping casts up while on the move and other specific scenarios.<br/>
				Each fight calls for a different strategy, but try to utilize it as much as possible.<br/><br/>
				Unless it's being used for <ActionLink {...ACTIONS.ASCEND} />, lightspeed should fit at least 6 GCDs.
				</Trans>
			</p>
			{panels.length === 0 && noCastsMessage}
			{panels.length > 0 && lightspeedDisplay}

		</Fragment>
	}
}
