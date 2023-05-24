import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import {Action, getPotencyWithMods, getBasePotency} from 'data/ACTIONS'
import {BonusModifier} from 'data/ACTIONS/type'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import DISPLAY_ORDER from 'parser/core/modules/DISPLAY_ORDER'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Button, Table} from 'semantic-ui-react'
import {Analyser} from '../Analyser'
import {Data} from './Data'

export interface PositionalResult {
	positional: Action,
	hits: Array<Events['damage']>,
	misses: Array<Events['damage']>
}

const NO_BONUS_PERCENT = 0

export abstract class Positionals extends Analyser {
	@dependency protected data!: Data
	@dependency private checklist!: Checklist
	@dependency private timeline!: Timeline

	static override handle = 'positionals'
	static override title = t('core.positionals.title')`Positionals`
	static override displayOrder = DISPLAY_ORDER.POSITIONALS

	private positionalResults: PositionalResult[] = []

	/**
	 * Jobs MUST provide a list of their positional actions
	 *
	 * TODO: This should just be a filter on all actions for the job for
	 * any actions they have with positional potencies.
	 */
	protected abstract positionals: Action[]

	override initialise() {
		this.addEventHook(
			filter<Event>().source(this.parser.actor.id).type('damage')
				.cause(this.data.matchCauseActionId(this.positionals.map(positional => positional.id))), this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: Events['damage']) {
		if (event.cause.type !== 'action') {
			return
		}
		const action = this.data.getAction(event.cause.action)
		if (action == null) {
			return
		}
		const positional = this.positionals.find(positional => positional === action)
		if (positional == null) {
			return
		}

		const positionalResult = this.getOrCreatePositionalResult(positional)

		// All positionals are single target skills, so getting the 0 index
		// should be all we need to do here.
		if (this.positionalHit(positional, event.targets[0].bonusPercent)) {
			positionalResult.hits.push(event)
		} else {
			positionalResult.misses.push(event)
		}
	}

	private getOrCreatePositionalResult(positional: Action) {
		let positionalResult = this.positionalResults.find(result => result.positional === positional)
		if (positionalResult == null) {
			positionalResult = {
				positional,
				hits: [],
				misses: [],
			}
			this.positionalResults.push(positionalResult)
		}
		return positionalResult
	}

	// The "hit" version of this function needs to check for more
	// things such as DRG's 5th hit combo buff and RPR's reaver buff.
	// Luckily, assessing misses is easy and sufficient for the purposes
	// of detecting positional hits.
	private missedPositionalBonusPercents(action: Action) {
		const missed_positional_combo_bonus_percent = this.calculateBonusPercent(
			getBasePotency(action),
			getPotencyWithMods(action, [BonusModifier.COMBO], []))
		return [...new Set([NO_BONUS_PERCENT, missed_positional_combo_bonus_percent])]
	}

	// Currently just checks that you didn't miss. Checking for hits would
	// otherwise be more complex.
	private positionalHit(action: Action, bonusPercent: number) {
		return !this.missedPositionalBonusPercents(action).includes(bonusPercent)
	}

	// The bonusPercent is based on the final potency number.
	private calculateBonusPercent(base: number, bonus: number) {
		return Math.trunc(100 * (1 - base / bonus))
	}

	private relativeTimestamp(timestamp: number) {
		return timestamp - this.parser.pull.timestamp
	}

	private createTimelineButton(timestamp: number) {
		const relative_timestamp = this.relativeTimestamp(timestamp)
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(relative_timestamp, relative_timestamp)}
			content={this.parser.formatEpochTimestamp(timestamp)}
		/>
	}

	private onComplete() {
		if (this.positionalResults.length === 0) {
			return
		}
		this.checklist.add(new Rule({
			name: <Trans id="core.positionals.checklist.title">Hit your positionals</Trans>,
			displayOrder: DISPLAY_ORDER.POSITIONALS,
			description: <Trans id="core.positionals.checklist.description">
				Melee DPS jobs have some skills that will do more damage when used from the rear or flank.
				Make sure you use those skills in the right position to do the most damage, or
				use <DataLink action="TRUE_NORTH"/> when you are out of position.
			</Trans>,
			requirements: this.positionalResults.map(this.positionalRequirement),
		}))
	}
	private positionalRequirement(result: PositionalResult) {
		const actual = result.hits.length
		const numMisses = result.misses.length
		const expected = actual + numMisses
		let percent = actual / expected * 100
		if (process.env.NODE_ENV === 'production') {
			percent = Math.min(percent, 100)
		}
		return new Requirement({
			name: <ActionLink {...result.positional}/>,
			percent: percent,
			weight: expected,
			overrideDisplay: `${actual} / ${expected} (${percent.toFixed(2)}%)`,
		})
	}

	override output(): React.ReactNode {
		const totalMisses = this.positionalResults.reduce((total, current) => total + current.misses.length, 0)

		if (totalMisses === 0) { return }

		return <Table compact unstackable celled textAlign="center">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell>
						<strong><Trans id="core.ui.positionals-table.header.action">Action</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="core.ui.positionals-table.header.hits">Hits</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="core.ui.positionals-table.header.misses">Misses</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					this.positionalResults.map(result => {
						const numHits = result.hits.length
						const numMisses = result.misses.length
						const success = numMisses === 0
						return <Table.Row key={result.positional.id}>
							<Table.Cell style={{whiteSpace: 'nowrap'}}>
								<ActionLink {...result.positional} showName={false} />
							</Table.Cell>
							<Table.Cell
								textAlign="center"
								positive={success}
								negative={!success}
							>{numHits}/{numMisses + numHits}
							</Table.Cell>
							<Table.Cell textAlign="left">
								{
									result.misses.map(miss => {
										return this.createTimelineButton(miss.timestamp)
									})
								}
							</Table.Cell>
						</Table.Row>
					})
				}
			</Table.Body>
		</Table>
	}
}
