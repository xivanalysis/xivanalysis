import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Constants
const QUEEN_ATTACKS = [
	ACTIONS.ROLLER_DASH.id,
	ACTIONS.ARM_PUNCH.id,
	ACTIONS.PILE_BUNKER.id,
]

const BATTERY_TO_MILLIS_FACTOR = 200 // Duration = Battery/5 seconds, or Battery*200 milliseconds

export default class YassQueen extends Module {
	static handle = 'queen'
	static title = t('mch.queen.title')`Automaton Queen Usage`

	static dependencies = [
		'brokenLog',
		'gauge',
		'suggestions',
	]

	_queens = {
		current: null,
		history: [],
	}

	constructor(...args) {
		super(...args)
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.AUTOMATON_QUEEN.id}, this._onQueenCast)
		this.addEventHook('damage', {by: 'pet', abilityId: QUEEN_ATTACKS}, this._onQueenAttack)
		this.addEventHook('complete', this._onComplete)
	}

	_finishQueenWindow() {
		if (this._queens.current) {
			this._queens.history.push(this._queens.current)
			this._queens.current = null
		}
	}

	_onQueenCast(event) {
		this._finishQueenWindow() // Just in case
		this._queens.current = {
			start: event.timestamp,
			casts: [],
			cost: this.gauge.lastQueenCost(),
			damage: 0,
		}
	}

	_onQueenAttack(event) {
		if (this._queens.current === null) {
			// How tho
			const action = getDataBy(ACTIONS, 'id', event.ability.guid)
			this.brokenLog.trigger(this, 'queenless queen attack', (
				<Trans id="mch.queen.trigger.queenless-queen-attack">
					A cast of <ActionLink {...action}/> was recorded without the Automaton Queen on the field.
				</Trans>
			))
			return
		}

		this._queens.current.casts.push({...event})
		this._queens.current.damage += event.amount
		if (event.ability.guid === ACTIONS.PILE_BUNKER.id) {
			this._finishQueenWindow()
		}
	}

	_onComplete() {
		this._finishQueenWindow()
		const missingBunkers = this._queens.history.filter(queen => queen.casts.length && queen.casts[queen.casts.length - 1].ability.guid !== ACTIONS.PILE_BUNKER.id).length

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.AUTOMATON_QUEEN.icon,
			content: <Trans id="mch.queen.suggestions.missing-bunker.content">
				Try to time your <ActionLink {...ACTIONS.AUTOMATON_QUEEN}/> windows so that they end while the boss is targetable, as Pile Bunker is a significant chunk of its damage. If the boss is about to jump or die, use <ActionLink {...ACTIONS.QUEEN_OVERDRIVE}/> to end it early and get the hit in.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: missingBunkers,
			why: <Trans id="mch.queen.suggestions.missing-bunker.why">
				{missingBunkers} of your Automaton Queen windows ended without a Pile Bunker.
			</Trans>,
		}))
	}

	output() {
		const panels = this._queens.history.map(queen => {
			return {
				title: {
					key: 'title-' + queen.start,
					content: <Fragment>
						{this.parser.formatTimestamp(queen.start)}
						<span> - </span>
						{queen.cost} Battery spent ({this.parser.formatDuration(queen.cost * BATTERY_TO_MILLIS_FACTOR)}), {queen.damage} total damage
					</Fragment>,
				},
				content: {
					key: 'content-' + queen.start,
					content: <Rotation events={queen.casts}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="mch.queen.accordion.message">The list below contains every <ActionLink {...ACTIONS.AUTOMATON_QUEEN}/> window from the fight, indicating when it started, its Battery cost and duration, and how much total damage the Queen did to its target. Expanding an individual window below will display every cast by the Automaton Queen made during it.</Trans>
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
