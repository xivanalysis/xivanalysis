import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'

// Constants
const OVERHEAT_DURATION_MILLIS = 8000

const OVERHEAT_GCD_TARGET = 5
const OVERHEAT_GCD_WARNING = 4
const OVERHEAT_GCD_ERROR = 0

export default class Heat extends Module {
	static handle = 'heat'
	static title = t('mch.heat.title')`Overheat Windows`

	_overheatWindows = {
		current: null,
		history: [],
	}

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player'}, this._onCast)
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.HYPERCHARGE.id}, this._onOverheat)
		this.addEventHook('death', {to: 'player'}, this._onDeath)
		this.addEventHook('complete', this._onComplete)
	}

	_finishOverheatWindow() {
		if (this._overheatWindows.current) {
			this._overheatWindows.current.gcdCount = this._overheatWindows.current.casts.filter(cast => {
				const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
				return action && action.onGcd
			}).length
			this._overheatWindows.history.push(this._overheatWindows.current)
			this._overheatWindows.current = null
		}
	}

	_onCast(event) {
		if (this._overheatWindows.current === null) {
			return
		}

		if (event.timestamp > (this._overheatWindows.current.start + OVERHEAT_DURATION_MILLIS)) {
			this._finishOverheatWindow()
			return
		}

		this._overheatWindows.current.casts.push({...event})
	}

	_onOverheat(event) {
		this._finishOverheatWindow() // Just in case; should happen rarely (if ever) in practice but I'd rather not clobber a window entirely
		this._overheatWindows.current = {
			start: event.timestamp,
			casts: [],
		}
	}

	_onDeath() {
		this._finishOverheatWindow()
	}

	_onComplete() {
		// TODO - Make this not actually yell about short windows if it's at the end of a fight?
		this._finishOverheatWindow()
	}

	_formatGcdCount(count) {
		if (count === OVERHEAT_GCD_ERROR) {
			return <span className="text-error">{count}</span>
		}

		if (count <= OVERHEAT_GCD_WARNING) {
			return <span className="text-warning">{count}</span>
		}

		return count
	}

	output() {
		const panels = this._overheatWindows.history.map(overheat => {
			return {
				title: {
					key: 'title-' + overheat.start,
					content: <Fragment>
						{this.parser.formatTimestamp(overheat.start)}
						<span> - </span>
						{this._formatGcdCount(overheat.gcdCount)}/{OVERHEAT_GCD_TARGET} <Plural id="mch.heat.panel-count" value={overheat.gcdCount} one="GCD" other="GCDs"/>
					</Fragment>,
				},
				content: {
					key: 'content-' + overheat.start,
					content: <Rotation events={overheat.casts}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="mch.heat.accordion.message">Every overheat window should ideally include {OVERHEAT_GCD_TARGET} casts of <ActionLink {...ACTIONS.HEAT_BLAST}/> and enough casts of <ActionLink {...ACTIONS.GAUSS_ROUND}/> and <ActionLink {...ACTIONS.RICOCHET}/> to avoid overcapping their charges. If you clip a lot while weaving, overcapping is still preferable to dropping a Heat Blast. Each overheat window below indicates how many GCDs it contained and will display all the casts in the window if expanded.</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</Fragment>
	}
}
