import React, {Fragment} from 'react'
import {Accordion, Message} from 'semantic-ui-react'

import ACTIONS from 'data/ACTIONS'
import PETS from 'data/PETS'
import Module from 'parser/core/Module'
import {SUMMON_BAHAMUT_LENGTH} from './Pets'

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
	static dependencies = [
		'gauge',
	]

	_current = null
	_history = []

	constructor(...args) {
		super(...args)
		this.addHook('cast', {
			by: 'pet',
			abilityId: DEMI_BAHAMUT_ACTIONS,
		}, this._onBahamutCast)
		this.addHook('summonpet', {petId: PETS.DEMI_BAHAMUT.id}, this._onSummonBahamut)
		this.addHook('complete', this._onComplete)
	}

	_onBahamutCast(event) {
		// Track Big B's casts, and mark potential ghosts
		const timeSinceSummon = event.timestamp - this._current.timestamp
		const ghostChance = timeSinceSummon >= SUMMON_BAHAMUT_LENGTH? GHOST_CHANCE.ABSOLUTE : timeSinceSummon < SUMMON_BAHAMUT_LENGTH - GHOST_TIMEFRAME? GHOST_CHANCE.NONE : GHOST_CHANCE.LIKELY
		this._current.petCasts.push({
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
			// playerCasts: [],
			petCasts: [],
		}
	}

	_onComplete() {
		// Clean out any current tracking
		if (this._current) {
			this._history.push(this._current)
		}
	}

	output() {
		const panels = this._history.map((sb, index) => {
			const counts = {}
			sb.petCasts.forEach(cast => {
				const obj = counts[cast.ability.guid] = counts[cast.ability.guid] || {}
				obj[cast.ghostChance] = (obj[cast.ghostChance] || 0) + 1
			})

			return {
				title: {
					key: 'title-' + index,
					content: <Fragment>
						{this.parser.formatTimestamp(sb.timestamp)}
						&nbsp;-&nbsp;
						{this.renderHeaderCount(counts[ACTIONS.WYRMWAVE.id])} WWs,&nbsp;
						{this.renderHeaderCount(counts[ACTIONS.AKH_MORN.id])} AMs
					</Fragment>,
				},
				content: {
					key: 'content-' + index,
					content: <ul>
						{sb.petCasts.map(cast => <li
							key={cast.timestamp}
							className={GHOST_CLASSNAME[cast.ghostChance]}
						>
							<strong>{this.parser.formatDuration(cast.timestamp - sb.timestamp, 2)}:</strong>&nbsp;
							{cast.ability.name}
						</li>)}
					</ul>,
				},
			}
		})

		return <Fragment>
			<Message>
				Bahamut actions can &quot;ghost&quot; - the action resolves, and appears to do damage, however no damage is actually applied to the target. <strong className="text-warning">Yellow</strong> highlighting has been applied to actions that likely ghosted, and <strong className="text-error">Red</strong>  to those that ghosted without a doubt.
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</Fragment>
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
