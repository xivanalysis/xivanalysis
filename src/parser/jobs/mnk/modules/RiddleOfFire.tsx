import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosestHigher} from 'utilities'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const ROF_DURATION = STATUSES.RIDDLE_OF_FIRE.duration * 1000

const POSSIBLE_GCDS = 9

const ROF_GCD = {
	TARGET: 9,
	WARNING: 8,
	ERROR: 7,
}

export default class RiddleOfFire extends Module {
	static handle = 'riddleoffire'
	static dependencies = [
		'suggestions',
	]

	static title = t('mnk.rof.title')`Riddle of Fire`
	static displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	_active = false
	_history = []
	_riddle = {casts: []}
	_rushing = false

	_missedGcds = 0
	_missedTks = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.RIDDLE_OF_FIRE.id}, this._onDrop)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.RIDDLE_OF_FIRE.id) {
			this._active = true
			this._riddle = {
				start: event.timestamp,
				end: null,
				casts: [],
			}

			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			this._rushing = ROF_DURATION >= fightTimeRemaining
		}

		// we only care about actual skills
		const action = getDataBy(ACTIONS, 'id', actionId)
		if (!this._active || !action || action.autoAttack) {
			return
		}

		this._riddle.casts.push(event)
	}

	_onDrop(event) {
		this._stopAndSave(event.timestamp)
	}

	_onComplete() {
		// Close up if RoF was active at the end of the fight
		if (this._active) {
			this._stopAndSave()
		}

		// Aggregate GCDs under each RoF
		const rofs = []
		this._history.forEach(riddle => {
			rofs.push(riddle.casts.filter(cast => {
				const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
				return action && action.onGcd
			}).length)
		})

		if (this._missedGcds) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.RIDDLE_OF_FIRE.icon,
				content: <Trans id="mnk.rof.suggestions.gcd.content">
					Aim to hit {POSSIBLE_GCDS} GCDs into each <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />.
				</Trans>,
				matcher: matchClosestHigher,
				tiers: {
					7: SEVERITY.MAJOR,
					8: SEVERITY.MEDIUM,
				},
				value: Math.min(...rofs),
				why: <Trans id="mnk.rof.suggestions.gcd.why">
					<Plural value={this._missedGcds} one="# GCD was" other="# GCDs were" /> missed during RoF.</Trans>,
			}))
		}

		if (this._missedTks) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.TORNADO_KICK.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="mnk.rof.suggestions.tk.content">
					Try to fit a <ActionLink {...ACTIONS.TORNADO_KICK} /> at the end of every <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />.
				</Trans>,
				why: <Trans id="mnk.rof.suggestions.tk.why">
					<Plural value={this._missedTks} one="# Tornado Kick was" other="# Tornado Kicks were" /> missed during RoF.
				</Trans>,
			}))
		}
	}

	_stopAndSave(endTime = this.parser.currentTimestamp) {
		if (!this._active) {
			return
		}

		this._active = false
		this._riddle.end = endTime
		this._riddle.rushing = this._rushing
		this._history.push(this._riddle)

		const gcds = this._riddle.casts.filter(cast => {
			const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
			return action && action.onGcd
		})
		const tks = this._riddle.casts.filter(cast => cast.ability.guid === ACTIONS.TORNADO_KICK.id)

		if (this._rushing || gcds.length > 1) {
			return
		}

		this._missedGcds += POSSIBLE_GCDS - gcds.length
		this._missedTks += 1 - tks.length
	}

	_formatGcdCount(count) {
		if (count <= ROF_GCD.ERROR) {
			return <span className="text-error">{count}</span>
		}

		if (count === ROF_GCD.WARNING) {
			return <span className="text-warning">{count}</span>
		}

		return count
	}

	output() {
		const panels = this._history.map(riddle => {
			const numGcds = riddle.casts.filter(cast => {
				const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
				return action && action.onGcd
			}).length
			const numTKs = riddle.casts.filter(cast => cast.ability.guid === ACTIONS.TORNADO_KICK.id).length

			return {
				key: riddle.start,
				title: {
					content: <>
						{this.parser.formatTimestamp(riddle.start)}
						<span> - </span>
						<Trans id="mnk.rof.table.gcd" render="span">
							{this._formatGcdCount(numGcds)} <Plural value={numGcds} one="GCD" other="GCDs" />
						</Trans>
						<span> - </span>
						<Trans id="mnk.rof.table.tk" render="span">
							{numTKs}/1 Tornado Kick
						</Trans>
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
