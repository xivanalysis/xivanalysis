import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import React from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

import {BuffEvent, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {matchClosestHigher} from 'utilities'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const ROF_DURATION = STATUSES.RIDDLE_OF_FIRE.duration * 1000

const POSSIBLE_GCDS = 9

const ROF_GCD = {
	TARGET: 9,
	WARNING: 8,
	ERROR: 7,
}

class Riddle {
	casts: CastEvent[]
	start: number
	end?: number
	active: boolean = false
	rushing: boolean = false

	constructor(start: number) {
		this.start = start
		this.casts = []
	}
}

export default class RiddleOfFire extends Module {
	static handle = 'riddleoffire'
	static title = t('mnk.rof.title')`Riddle of Fire`
	static displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	@dependency private suggestions!: Suggestions

	private history: Riddle[] = []
	private riddle?: Riddle

	protected init(): void {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.RIDDLE_OF_FIRE.id}, this.onDrop)
		this.addHook('complete', this.onComplete)
	}

	onCast(event: CastEvent): void {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO // should be Action type

		if (!action) {
			return
		}

		if (action.id === ACTIONS.RIDDLE_OF_FIRE.id) {
			this.riddle = new Riddle(event.timestamp)

			this.riddle.active = true
			this.riddle.rushing = ROF_DURATION >= this.parser.fight.end_time - event.timestamp
			return
		}

		// we only care about actual skills
		if (this.riddle && this.riddle.active && action.onGcd) {
			this.riddle.casts.push(event)
		}
	}

	private onDrop(event: BuffEvent): void {
		this.stopAndSave(event.timestamp)
	}

	private onComplete(): void {
		// Close up if RoF was active at the end of the fight
		if (this.riddle && this.riddle.active) {
			this.stopAndSave()
		}

		// Aggregate GCDs under each RoF
		const missedGcds = this.history
			.filter(riddle => !riddle.rushing)
			.map(riddle => POSSIBLE_GCDS - this.getGcdCount(riddle))
			.reduce((total, current) => total + current, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.RIDDLE_OF_FIRE.icon,
			content: <Trans id="mnk.rof.suggestions.gcd.content">
				Aim to hit {POSSIBLE_GCDS} GCDs into each <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />.
			</Trans>,
			matcher: matchClosestHigher,
			tiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			value: missedGcds,
			why: <Trans id="mnk.rof.suggestions.gcd.why">
				<Plural value={missedGcds} one="# GCD was" other="# GCDs were" /> missed during RoF.</Trans>,
		}))
	}

	private stopAndSave(endTime: number = this.parser.currentTimestamp): void {
		if (this.riddle && this.riddle.active) {
			this.history.push({...this.riddle, active: false, end: endTime})
		}
	}

	private getGcdCount(riddle: Riddle): number {
		return riddle.casts.filter(cast => {
			const action = getDataBy(ACTIONS, 'id', cast.ability.guid) as TODO
			return action && action.onGcd
		}).length
	}

	private formatGcdCount(count: number): JSX.Element {
		if (count <= ROF_GCD.ERROR) {
			return <span className="text-error">{count}</span>
		}

		if (count === ROF_GCD.WARNING) {
			return <span className="text-warning">{count}</span>
		}

		return <span className="text-success">{count}</span>
	}

	output() {
		const panels = this.history.map(riddle => {
			const numGcds = this.getGcdCount(riddle)

			return {
				key: riddle.start,
				title: {
					content: <>
						{this.parser.formatTimestamp(riddle.start)}
						<span> - </span>
						<Trans id="mnk.rof.table.gcd" render="span">
							{this.formatGcdCount(numGcds)} <Plural value={numGcds} one="GCD" other="GCDs" />
						</Trans>
						<span> - </span>
						{riddle.rushing && <>
							&nbsp;<Trans id="mnk.rof.table.rushing" render="span" className="text-info">(rushing)</Trans>
						</>}
					</>,
				},
				content: {
					content: <Rotation events={riddle.casts}/>,
				},
			}
		})

		return <>
			<Message>
				<Trans id="mnk.rof.accordion.message">
					Every <StatusLink {...STATUSES.RIDDLE_OF_FIRE}/> window should ideally contain {ROF_GCD.TARGET} GCDs as your skill speed allows and as many OGCDs as you can weave.
				</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</>
	}
}
