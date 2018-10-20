import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosestHigher} from 'utilities'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const ROF_DURATION = STATUSES.RIDDLE_OF_FIRE.duration * 1000

const POSSIBLE_GCDS = 9

export default class RiddleOfFire extends Module {
	static handle = 'riddleoffire'
	static dependencies = [
		'suggestions',
	]

	static title = 'Riddle of Fire'
	static displayOrder = DISPLAY_ORDER.RIDDLE_OF_FIRE

	_active = false
	_history = []
	_riddle = {}
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
		if (!this._active || getAction(actionId).autoAttack) {
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
			rofs.push(riddle.casts.filter(cast => getAction(cast.ability.guid).onGcd).length)
		})

		if (this._missedGcds) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.RIDDLE_OF_FIRE.icon,
				content: <Fragment>
					Aim to hit {POSSIBLE_GCDS} GCDs into each <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />.
				</Fragment>,
				matcher: matchClosestHigher,
				tiers: {
					7: SEVERITY.MAJOR,
					8: SEVERITY.MEDIUM,
				},
				value: Math.min(...rofs),
				why: `${this._missedGcds} GCDs missed during RoF.`,
			}))
		}

		if (this._missedTks) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.TORNADO_KICK.icon,
				severity: SEVERITY.MEDIUM,
				content: <Fragment>
					Try to fit a <ActionLink {...ACTIONS.TORNADO_KICK} /> at the end of every <StatusLink {...STATUSES.RIDDLE_OF_FIRE} />.
				</Fragment>,
				why: <Fragment>
					{this._missedTks} Tornado Kick{this._missedTks !== 1 ? 's were' : ' was'} missed during RoF.
				</Fragment>,
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

		const gcds = this._riddle.casts.filter(cast => getAction(cast.ability.guid).onGcd)
		const tks = this._riddle.casts.filter(cast => cast.ability.guid === ACTIONS.TORNADO_KICK.id)

		if (this._rushing || gcds.length > 1) {
			return
		}

		this._missedGcds += POSSIBLE_GCDS - gcds.length
		this._missedTks += 1 - tks.length
	}

	output() {
		const panels = this._history.map(riddle => {
			const numGcds = riddle.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			const numTKs = riddle.casts.filter(cast => cast.ability.guid === ACTIONS.TORNADO_KICK.id).length

			return {
				key: riddle.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(riddle.start)}
						<span> - </span>
						<span>{numGcds} GCDs</span>
						<span> - </span>
						<span>{numTKs}/1 Tornado Kick</span>
						{riddle.rushing && <span className="text-info">&nbsp;(rushing)</span>}
					</Fragment>,
				},
				content: {
					content: <Rotation events={riddle.casts}/>,
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
