import {Trans, i18nMark} from '@lingui/react'
import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import ACTIONS, {getAction} from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'
import {SUMMON_BAHAMUT_LENGTH} from './Pets'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const DEMI_BAHAMUT_ACTIONS = Object.values(ACTIONS)
	.filter(action => action.pet && action.pet === PETS.DEMI_BAHAMUT.id)
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

export default class Bahamut extends Module {
	static handle = 'bahamut'
	static i18n_id = i18nMark('smn.bahamut.title')
	static dependencies = [
		'gauge',
	]
	static displayOrder = DISPLAY_ORDER.BAHAMUT

	_current = null
	_history = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onPlayerCast)
		this.addHook('cast', {
			by: 'pet',
			abilityId: DEMI_BAHAMUT_ACTIONS,
		}, this._onBahamutCast)
		this.addHook('summonpet', {petId: PETS.DEMI_BAHAMUT.id}, this._onSummonBahamut)
		this.addHook('complete', this._onComplete)
	}

	_onPlayerCast(event) {
		// Ignore autos
		const action = getAction(event.ability.guid)
		if (action.autoAttack) { return }

		// Track player actions during SB
		if (this.gauge.bahamutSummoned()) {
			this._current.casts.push(event)
		}
	}

	_onBahamutCast(event) {
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
		const ghostChance = timeSinceSummon >= SUMMON_BAHAMUT_LENGTH? GHOST_CHANCE.ABSOLUTE : timeSinceSummon < SUMMON_BAHAMUT_LENGTH - GHOST_TIMEFRAME? GHOST_CHANCE.NONE : GHOST_CHANCE.LIKELY
		this._current.casts.push({
			...event,
			ghostChance,
		})
	}

	_onSummonBahamut(event) {
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
				obj[cast.ghostChance] = (obj[cast.ghostChance] || 0) + 1
			})

			const lastPetAction = sb.casts.reduce((carry, cast, i) => this.parser.byPlayerPet(cast)? i : carry, null)

			return {
				key: sb.timestamp,
				title: {
					content: <>
						{this.parser.formatTimestamp(sb.timestamp)}
						&nbsp;-&nbsp;
						{this.renderHeaderCount(counts[ACTIONS.WYRMWAVE.id])} WWs,&nbsp;
						{this.renderHeaderCount(counts[ACTIONS.AKH_MORN.id])} AMs
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
				<Trans id="smn.bahamut.ghost-disclaimer">Bahamut actions can &quot;ghost&quot; - the action resolves, and appears to do damage, however no damage is actually applied to the target. <strong className="text-warning">Yellow</strong> highlighting has been applied to actions that likely ghosted, and <strong className="text-error">Red</strong> to those that ghosted without a doubt.<br/>
				You should be aiming for 11 Wyrmwaves and 2 Akh Morns in each Summon Bahamut window unless rushing or cleaving multiple targets.</Trans>
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
