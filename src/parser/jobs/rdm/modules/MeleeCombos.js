import React, {Fragment} from 'react'

//import CoreCombos from 'parser/core/modules/Combos'
//import {ActionLink} from 'components/ui/DbLink'
//import STATUSES from 'data/STATUSES'
import {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
//import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
//import {matchClosestLower} from 'utilities'
import {Accordion} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'

/*const COMBO_ACTIONS = [
	ACTIONS.ENCHANTED_RIPOSTE.id,
	ACTIONS.ENCHANTED_ZWERCHHAU.id,
	ACTIONS.ENCHANTED_REDOUBLEMENT.id,
	ACTIONS.VERHOLY.id,
	ACTIONS.VERFLARE.id,
	ACTIONS.RIPOSTE.id,
	ACTIONS.ZWERCHHAU.id,
	ACTIONS.REDOUBLEMENT.id,
]*/

export default class MeleeCombos extends Module {
	static handle = 'meleecombos'
	static dependencies = [
		'gauge',
	]
	static title = 'Melee Combos'

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('death', {to: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_meleeCombos = {}

	_startCombo(event, action) {
		const actionMana = this.gauge.manaGain(action.id)
		this._currentCombo = {
			start: event.timestamp,
			startmana: {
				white: this.gauge.whiteMana - actionMana.white,
				black: this.gauge.blackMana - actionMana.black,
			},
			events: [event],
		}
	}

	_breakComboIfExists() {
		if (this._currentCombo) {
			this._currentCombo.broken = true
			this._endCombo()
		}
	}

	_endCombo() {
		this._meleeCombos[this._currentCombo.start] = this._currentCombo
		delete this._currentCombo
	}

	_onCast(event) {
		const action = getAction(event.ability.guid)
		if (action.combo) {
			if (action.combo.start) {
				this._breakComboIfExists()
				this._startCombo(event, action)
			} else {
				if (!this._currentCombo) {
					console.log(`Uncomboed ability: ${event.ability.name}, timestamp: ${this.parser.formatTimestamp(event.timestamp)}`)
				}

				const lastAction = this._currentCombo.events[this._currentCombo.events.length-1]
				if (action.combo.from !== lastAction.ability.guid) {
					this._currentCombo.broken = true
					this._endCombo()
				} else {
					this._currentCombo.events.push(event)
					if (action.combo.end) {
						this._currentCombo.finisher = action.id
						this._endCombo()
					}
				}
			}
		}

		if (action.breaksCombo) {
			this._breakComboIfExists()
		}
	}

	output() {
		const panels = Object.keys(this._meleeCombos)
			.map(timestamp => {
				const white = this._meleeCombos[timestamp].startmana.white
				const black = this._meleeCombos[timestamp].startmana.black
				return ({
					key: timestamp,
					title: {content: <Fragment>
						{this.parser.formatTimestamp(timestamp)}
						<span> - </span>
						<span>Starting Mana {white} White | {black} Black</span>
					</Fragment>,
					},
					content: {
						content: <Rotation events={this._meleeCombos[timestamp].events}/>,
					},
				})
			})

		return (
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		)
	}
}
