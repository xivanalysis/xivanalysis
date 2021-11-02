import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {ActionKey} from 'data/ACTIONS'
import {Cause, Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import BrokenLog from 'parser/core/modules/BrokenLog'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'
import {isDefined} from 'utilities'
import {Gauge} from './Gauge'

const QUEEN_WEAPONSKILLS: ActionKey[] = [
	'ARM_PUNCH',
	'PILE_BUNKER',
	'ROLLER_DASH',
]

// Duration = Battery/5 seconds <=> Battery*200 milliseconds
const BATTERY_TO_MILLIS_FACTOR = 200

interface QueenAttack {
	event: Events['damage']
	action: number
	damage: number
}

interface QueenUsage {
	start: number
	end?: number
	battery: number
	rotation: QueenAttack[]
}

export default class YassQueen extends Analyser {
	static override handle = 'queen'
	static override title = t('mch.queen.title')`Automaton Queen Usage`

	@dependency private brokenLog!: BrokenLog
	@dependency private data!: Data
	@dependency private gauge!: Gauge
	@dependency private suggestions!: Suggestions

	private summons: QueenUsage[] = []

	override initialise() {
		const queenWeaponskillIds = QUEEN_WEAPONSKILLS.map(actionKey => this.data.actions[actionKey].id)

		const queens = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const queenDamageFilter = filter<Event>()
			.source(oneOf(queens))
			.type('damage')
			.cause(filter<Cause>()
				.type('action')
				.action(oneOf(queenWeaponskillIds)))

		this.addEventHook(playerFilter.action(this.data.actions.AUTOMATON_QUEEN.id), this.onSummon)
		this.addEventHook(queenDamageFilter, this.onDamage)
		this.addEventHook('complete', this.onComplete)
	}

	private get activeQueen(): QueenUsage | undefined {
		const lastQueen = _.last(this.summons)
		if (lastQueen && !isDefined(lastQueen.end)) {
			return lastQueen
		}
		return undefined
	}

	private handleBrokenLog(actionId: number) {
		const action = this.data.getAction(actionId)
		this.brokenLog.trigger(this, 'queenless queen attack', (
			<Trans id="mch.queen.trigger.queenless-queen-attack">
				A cast of <ActionLink {...action}/> was recorded without the Automaton Queen on the field.
			</Trans>
		))
		return
	}

	private onSummon(event: Events['action']) {
		if (this.activeQueen) {
			this.activeQueen.end = event.timestamp
		}

		this.summons.push({
			start: event.timestamp,
			battery: this.gauge.lastQueenCost,
			rotation: [],
		})
	}

	private onDamage(event: Events['damage']) {
		if (event.cause.type !== 'action') { return }

		if (!this.activeQueen) {
			return this.handleBrokenLog(event.cause.action)
		}

		this.activeQueen.rotation.push({
			event: event,
			action: event.cause.action,
			damage: event.targets[0].amount,
		})

		if (event.cause.action === this.data.actions.PILE_BUNKER.id) {
			this.activeQueen.end = event.timestamp
		}
	}

	private onComplete() {
		this.summons.forEach(q => this.debug(q))

		const missedPileBunkers = this.summons
			.filter(queen => _.last(queen.rotation)?.action !== this.data.actions.PILE_BUNKER.id)
			.length

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AUTOMATON_QUEEN.icon,
			content: <Trans id="mch.queen.suggestions.missing-bunker.content">
				Try to time your <ActionLink action="AUTOMATON_QUEEN"/> windows so that they end while the boss is targetable, as Pile Bunker is a significant chunk of its damage. If the boss is about to jump or die, use <ActionLink {...this.data.actions.QUEEN_OVERDRIVE}/> to end it early and get the hit in.
			</Trans>,
			tiers: {
				1: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: missedPileBunkers,
			why: <Trans id="mch.queen.suggestions.missing-bunker.why">
				{missedPileBunkers} of your Automaton Queen windows ended without a Pile Bunker.
			</Trans>,
		}))
	}

	override output() {
		const panels = this.summons.map(queen => {
			const totalDamage = queen.rotation
				.reduce((total, attack) => total + attack.damage, 0)

			return {
				title: {
					key: 'title-' + queen.start,
					content: <Fragment>
						{this.parser.formatTimestamp(queen.start)}
						<span> - </span>
						{queen.battery} Battery spent ({this.parser.formatDuration(queen.battery * BATTERY_TO_MILLIS_FACTOR)}), {totalDamage} total damage
					</Fragment>,
				},
				content: {
					key: 'content-' + queen.start,
					content: <Rotation events={queen.rotation.map(attack => attack.event)}/>,
				},
			}
		})

		return <Fragment>
			<Message>
				<Trans id="mch.queen.accordion.message">The list below contains every <ActionLink {...this.data.actions.AUTOMATON_QUEEN}/> window from the fight, indicating when it started, its Battery cost and duration, and how much total damage the Queen did to its target. Expanding an individual window below will display every cast by the Automaton Queen made during it.</Trans>
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
