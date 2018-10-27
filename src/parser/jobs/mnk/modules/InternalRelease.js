import React, {Fragment} from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import ACTIONS, {getAction} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const IR_DURATION = STATUSES.INTERNAL_RELEASE.duration * 1000

export default class InternalRelease extends Module {
	static handle = 'internalrelease'
	static dependencies = [
		'suggestions',
	]

	static title = 'Internal Release'
	static displayOrder = DISPLAY_ORDER.INTERNAL_RELEASE

	_active = false
	_history = []
	_release = {}
	_rushing = false

	_badElixirs = 0
	_badHowlings = 0

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.INTERNAL_RELEASE.id}, this._onDrop)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.INTERNAL_RELEASE.id) {
			this._active = true
			this._release = {
				start: event.timestamp,
				end: null,
				casts: [],
			}

			const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
			this._rushing = IR_DURATION >= fightTimeRemaining
		}

		// we only care about actual skills
		if (!this._active || getAction(actionId).autoAttack) {
			return
		}

		this._release.casts.push(event)
	}

	_onDrop(event) {
		this._active = false
		this._release.end = event.timestamp
		this._release.rushing = this._rushing
		this._history.push(this._release)

		// Check cooldowns
		if (!this._release.casts.some(cast => cast.ability.guid === ACTIONS.ELIXIR_FIELD.id)) {
			this._badElixirs++
		}

		if (!this._release.casts.some(cast => cast.ability.guid === ACTIONS.HOWLING_FIST.id)) {
			this._badHowlings++
		}
	}

	_onComplete() {
		// Close up if IR was active at the end of the fight
		if (this._active) {
			this._active = false
			this._release.end = this.parser.currentTimestamp
			this._history.push(this._release)
		}

		if (this._badElixirs > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.ELIXIR_FIELD.icon,
				severity: SEVERITY.MEDIUM,
				content: <Fragment>
					Try to get every second <ActionLink {...ACTIONS.ELIXIR_FIELD} /> inside <StatusLink {...STATUSES.INTERNAL_RELEASE} />.
				</Fragment>,
				why: <Fragment>
					{this._badElixirs} Elixir Field{this._badElixirs !== 1 ? 's were' : ' was'} missed inside of IR.
				</Fragment>,
			}))
		}

		if (this._badHowlings > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HOWLING_FIST.icon,
				severity: SEVERITY.MEDIUM,
				content: <Fragment>
					Try to get every <ActionLink {...ACTIONS.HOWLING_FIST} /> inside <StatusLink {...STATUSES.INTERNAL_RELEASE} />.
				</Fragment>,
				why: <Fragment>
					{this._badHowlings} Howling Fist{this._badHowlings !== 1 ? 's were' : ' was'} outside of IR.
				</Fragment>,
			}))
		}
	}

	output() {
		const panels = this._history.map(ir => {
			const numGcds = ir.casts.filter(cast => getAction(cast.ability.guid).onGcd).length
			const numElixirs = ir.casts.filter(cast => cast.ability.guid === ACTIONS.ELIXIR_FIELD.id).length
			const numHowlings = ir.casts.filter(cast => cast.ability.guid === ACTIONS.HOWLING_FIST.id).length

			return {
				key: ir.start,
				title: {
					content: <Fragment>
						{this.parser.formatTimestamp(ir.start)}
						<span> - </span>
						<span>{numGcds} GCDs</span>
						<span> - </span>
						<span>{numElixirs}/1 Elixir Field</span>
						<span> - </span>
						<span>{numHowlings}/1 Howling Fist</span>
						{ir.rushing && <span className="text-info">&nbsp;(rushing)</span>}
					</Fragment>,
				},
				content: {
					content: <Rotation events={ir.casts}/>,
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
