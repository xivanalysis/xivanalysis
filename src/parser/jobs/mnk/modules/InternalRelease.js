import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import React from 'react'
import {Accordion} from 'semantic-ui-react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import Rotation from 'components/ui/Rotation'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
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

	static title = t('mnk.ir.title')`Internal Release`
	static displayOrder = DISPLAY_ORDER.INTERNAL_RELEASE

	_active = false
	_history = []
	_release = {casts: []}
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
		const action = getDataBy(ACTIONS, 'id', actionId)
		if (!this._active || !action || action.autoAttack) {
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
				content: <Trans id="mnk.ir.suggestions.elixir.content">
					Try to get every second <ActionLink {...ACTIONS.ELIXIR_FIELD} /> inside <StatusLink {...STATUSES.INTERNAL_RELEASE} />.
				</Trans>,
				why: <Trans id="mnk.ir.suggestions.elixir.why">
					<Plural value={this._badElixirs} one="# Elixir Field was" other="# Elixir Fields were" /> missed inside of IR.
				</Trans>,
			}))
		}

		if (this._badHowlings > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.HOWLING_FIST.icon,
				severity: SEVERITY.MEDIUM,
				content: <Trans id="mnk.ir.suggestions.howling.content">
					Try to get every <ActionLink {...ACTIONS.HOWLING_FIST} /> inside <StatusLink {...STATUSES.INTERNAL_RELEASE} />.
				</Trans>,
				why: <Trans id="mnk.ir.suggestions.howling.why">
					<Plural value={this._badHowlings} one="# Howling Fist was" other="# Howling Fists were" /> executed outside of IR.
				</Trans>,
			}))
		}
	}

	output() {
		const panels = this._history.map(ir => {
			const numGcds = ir.casts.filter(cast => {
				const action = getDataBy(ACTIONS, 'id', cast.ability.guid)
				return action && action.onGcd
			}).length
			const numElixirs = ir.casts.filter(cast => cast.ability.guid === ACTIONS.ELIXIR_FIELD.id).length
			const numHowlings = ir.casts.filter(cast => cast.ability.guid === ACTIONS.HOWLING_FIST.id).length

			return {
				key: ir.start,
				title: {
					content: <>
						{this.parser.formatTimestamp(ir.start)}
						<span> - </span>
						<span><Plural id="mnk.ir.table.gcd" value={numGcds} one="# GCD" other="# GCDs" /></span>
						<span> - </span>
						<Trans id="mnk.ir.table.ef" render="span">
							{numElixirs}/1 Elixir Field
						</Trans>
						<span> - </span>
						<Trans id="mnk.ir.table.hf" render="span">
							{numHowlings}/1 Howling Fist
						</Trans>
						{ir.rushing && <>
							&nbsp;<Trans id="mnk.ir.table.rushing" render="span" className="text-info">(rushing)</Trans>
						</>}
					</>,
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
