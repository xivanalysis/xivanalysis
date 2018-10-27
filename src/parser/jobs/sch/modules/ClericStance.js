import React, {Fragment} from 'react'
import _ from 'lodash'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Accordion, Message, Icon} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'
import STATUSES from 'data/STATUSES'

// all these suggestions for CS are ultimately trivial :notlikeblob:
const defaultSeverityTiers = {
	1: SEVERITY.MINOR,
}

// list of things to track for CS usage.
// can override the suggestions from the default template here
const EXPECTED_CASTS = [
	{
		...getAction(ACTIONS.CLERIC_STANCE.id), // track GCDs via the CS id
		name: 'GCD',
		count: 6,
	},
	{
		...getAction(ACTIONS.BIO_II.id),
		count: 1,
	},
	{
		...getAction(ACTIONS.MIASMA.id),
		count: 1,
	},
	{
		...getAction(ACTIONS.SHADOW_FLARE.id),
		count: 1,
		content: <Fragment>
			Try to land a <ActionLink {...ACTIONS.SHADOW_FLARE} /> during <ActionLink {...ACTIONS.CLERIC_STANCE} /> if both will be available at the same time.
			Avoid casting <ActionLink {...ACTIONS.SHADOW_FLARE} /> right before  <ActionLink {...ACTIONS.CLERIC_STANCE} />
		</Fragment>},
]

export default class ClericStance extends Module {
	static displayOrder = 99;
	static handle = 'clericstance';
	static dependencies = [
		'suggestions',
		'cooldowns',
		'gcd',
	];

	static title = 'Cleric Stance Usage'

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('removebuff', {to: 'player', abilityId: [STATUSES.CLERIC_STANCE.id]}, this._onEnd)
		this.addHook('complete', this._onComplete)
	}

	_buffStart = null
	_buffRotations = {}
	_potentialShadowFlareUsages = [];

	_onCast(event) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.CLERIC_STANCE.id) {
			this._buffStart = event.timestamp
			this._buffRotations[this._buffStart] = []

			if (this._canShadowFlareBeUsed()) {
				this._potentialShadowFlareUsages.push(this._buffStart)
			}

		}

		if (this._buffStart) {
			this._buffRotations[this._buffStart].push(event)
		}
	}

	_canShadowFlareBeUsed() {
		const {id, cooldown} = getAction(ACTIONS.SHADOW_FLARE.id)

		const cooldownRemaining = this.cooldowns.getCooldownRemaining(id)
		if (cooldownRemaining - (STATUSES.CLERIC_STANCE.duration * 1000) < this.gcd.getEstimate()) {
			// cooldown will come off before CS duration expires
			// this probably won't be accurate if the CS duration gets extended, idk.
			return true
		}

		if ((cooldown * 1000 - cooldownRemaining) < this.gcd.getEstimate()) {
			// if it was recently used as far as 1 gcd before popping cleric,
			// let's count it as a potential wasted usage
			return true
		}

		return false
	}

	_onEnd() {
		this._buffStart = null
	}

	_onComplete() {
		EXPECTED_CASTS.forEach(({id, name, icon, count, why, content, tiers}) => {
			const expected = _.reduce(this._buffRotations,
				(total, rotation, timestamp) => total +
					this._getExpectedCastsPerRotation(timestamp, id, count)
				, 0)

			// Math.min will not count extra casts beyond what is expected per rotation
			const actual = _.reduce(this._buffRotations,
				(total, rotation) => total + Math.min(
					this._getActualCastsPerRotation(rotation, id),
					count
				), 0)

			const diff = expected - actual

			this.suggestions.add(new TieredSuggestion({
				icon,
				why: why || `${diff} cast${diff !== 1 ? 's' : ''} missed during ${ACTIONS.CLERIC_STANCE.name} windows.`,
				content: content || <Fragment>
					Try to land {count} {name}{count !== 1 ? 's' : ''} during every <ActionLink {...ACTIONS.CLERIC_STANCE} /> window.
				</Fragment>,
				tiers: tiers || defaultSeverityTiers,
				value: diff,
			}))
		})
	}

	_getExpectedCastsPerRotation(timestamp, id, count) {
		switch (id) {
		case ACTIONS.SHADOW_FLARE.id:
			return this._potentialShadowFlareUsages.includes(+timestamp) ? 1 : 0
		default:
			return count
		}
	}

	_getActualCastsPerRotation(rotation, id) {
		switch (id) {
		case ACTIONS.CLERIC_STANCE.id: // sneaky way to check if GCD
			return rotation.filter(event => getAction(event.ability.guid).onGcd).length
		default:
			return rotation.filter(event => event.ability.guid === +id).length
		}
	}

	output() {
		// no cleric used, don't bother
		if (Object.keys(this._buffRotations).length < 1) {
			return null
		}

		const panels = Object.entries(this._buffRotations)
			.map(([timestamp, rotation]) => {
				return ({
					key: timestamp,
					title: {
						content: <Fragment>
							{[
								this.parser.formatTimestamp(timestamp),
								...EXPECTED_CASTS.map(({id, name, count}) => {
									const expected = this._getExpectedCastsPerRotation(timestamp, id, count)
									if (expected < 1) {
										return null
									}

									return `${this._getActualCastsPerRotation(rotation, id)} / ${expected} ${name}${count !== 1 ? 's' : ''} `
								})
									.filter(Boolean),
							].join(' - ')}
						</Fragment>,
					},
					content: {
						content: <Rotation events={this._buffRotations[timestamp]}/>,
					},
				})
			})

		return (
			<Fragment>
				<Message info icon>
					<Icon name="info"/>
					<Message.Content>
						Cleric Stance is about a 1% increase in DPS, which is lost if you end up clipping a GCD for it.
						Focus on using it pre-pull or whenever you can freely weave it, especially when Shadow Flare is up.
					</Message.Content>
				</Message>
				<Accordion
					exclusive={false}
					panels={panels}
					styled
					fluid
				/>
			</Fragment>
		)
	}
}
