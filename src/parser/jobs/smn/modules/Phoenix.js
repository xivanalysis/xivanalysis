import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'
import {DEMI_SUMMON_LENGTH} from './Pets'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const DEMI_PHOENIX_ACTIONS = Object.values(ACTIONS)
	.filter(action => action.pet && action.pet === PETS.DEMI_PHOENIX.id)
	.map(action => action.id)
const GHOST_TIMEFRAME = 500

const GHOST_CHANCE = {
	NONE: 0,
	LIKELY: 1,
	ABSOLUTE: 2,
}

const GHOST_CLASSNAME = {
	[GHOST_CHANCE.LIKELY]: 'text-warning',
	[GHOST_CHANCE.ABSOLUTE]: 'text-error',
}

export default class Phoenix extends Module {
	static handle = 'phoenix'
	static title = t('smn.phoenix.title')`Phoenix`
	static dependencies = [
		'gauge',
	]
	static displayOrder = DISPLAY_ORDER.PHOENIX

	_current = null
	_history = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onPlayerCast)
		this.addHook('cast', {
			by: 'pet',
			abilityId: DEMI_PHOENIX_ACTIONS,
		}, this._onPhoenixCast)
		this.addHook('summonpet', {petId: PETS.DEMI_PHOENIX.id}, this._onSummonPhoenix)
		this.addHook('complete', this._onComplete)
	}

	_onPlayerCast(event) {
		// Ignore autos
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (!action || action.autoAttack) { return }

		// Track player actions during SB
		if (this.gauge.phoenixSummoned() &&
			(action.onGcd || event.ability.guid === ACTIONS.ENKINDLE_PHOENIX.id)
		) {
			this._current.casts.push(event)
		}
	}

	_onPhoenixCast(event) {
		// If we've _somehow_ not got a _current, fake one
		if (!this._current) {
			this._current = {
				timestamp: event.timestamp,
				rushing: this.gauge.isRushing(),
				casts: [],
			}
		}

		// Track Big B's casts, and mark potential ghosts
		const timeSinceSummon = event.timestamp - this._current.timestamp
		const ghostChance = timeSinceSummon >= DEMI_SUMMON_LENGTH? GHOST_CHANCE.ABSOLUTE : timeSinceSummon < DEMI_SUMMON_LENGTH - GHOST_TIMEFRAME? GHOST_CHANCE.NONE : GHOST_CHANCE.LIKELY
		this._current.casts.push({
			...event,
			ghostChance,
		})
	}

	_onSummonPhoenix(event) {
		// Save any existing tracking to history
		if (this._current) {
			this._history.push(this._current)
		}

		// Set up fresh tracking
		this._current = {
			timestamp: event.timestamp,
			rushing: this.gauge.isRushing(),
			casts: [],
		}
	}

	_onComplete() {
		// Clean out any current tracking
		if (this._current) {
			this._history.push(this._current)
		}
	}

	output() {
		const panels = this._history.map(sb => {
			const counts = {}
			sb.casts.forEach(cast => {
				const obj = counts[cast.ability.guid] = counts[cast.ability.guid] || {}
				//phoenix includes both player and pet casts.  player casts will not have
				//a ghost chance property, so use None when counting these.
				const ghostIndex = cast.ghostChance || GHOST_CHANCE.NONE
				obj[ghostIndex] = (obj[ghostIndex] || 0) + 1
			})

			const lastPetAction = sb.casts.reduce((carry, cast, i) => this.parser.byPlayerPet(cast)? i : carry, null)

			return {
				key: sb.timestamp,
				title: {
					content: <>
						{this.parser.formatTimestamp(sb.timestamp)}
						&nbsp;-&nbsp;
						{this.renderHeaderCount(counts[ACTIONS.FOUNTAIN_OF_FIRE.id])} FOF,&nbsp;
						{this.renderHeaderCount(counts[ACTIONS.BRAND_OF_PURGATORY.id])} BOP,&nbsp;
						{this.renderHeaderCount(counts[ACTIONS.SCARLET_FLAME.id])} SF,&nbsp;
						{this.renderHeaderCount(counts[ACTIONS.REVELATION.id])} R
						{sb.rushing && <span className="text-info">&nbsp;(rushing)</span>}
					</>,
				},
				content: {
					content: <ul>
						{sb.casts.map((cast, i) => i <= lastPetAction && <li
							key={cast.timestamp + '-' + cast.ability.guid}
							className={GHOST_CLASSNAME[cast.ghostChance]}
						>
							<strong>{this.parser.formatDuration(cast.timestamp - sb.timestamp, 2)}:</strong>&nbsp;
							{cast.ability.name}
						</li>)}
					</ul>,
				},
			}
		})

		return <>
			<Message>
				<Trans id="smn.phoenix.ghost-disclaimer">Phoenix actions can &quot;ghost&quot; - the action resolves, and appears to do damage, however no damage is actually applied to the target. <strong className="text-warning">Yellow</strong> highlighting has been applied to actions that likely ghosted, and <strong className="text-error">Red</strong> to those that ghosted without a doubt.<br/>
				You should be aiming for 4 Fountain Of Fire, 4 Brand of Purgatory, 8 Scarlet Flame, and 2 Revelation in each Firebird Trance window unless rushing.</Trans>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</>
	}

	renderHeaderCount(counts) {
		if (!counts) {
			return '0'
		}

		return [
			GHOST_CHANCE.NONE,
			GHOST_CHANCE.LIKELY,
			GHOST_CHANCE.ABSOLUTE,
		].map((chance, i) => counts[chance] && <Fragment key={chance}>
			{i > 0 && '/'}
			<span className={GHOST_CLASSNAME[chance]}>{counts[chance]}</span>
		</Fragment>)
	}
}
