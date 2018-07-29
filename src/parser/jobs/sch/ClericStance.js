import React, {Fragment} from 'react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS, {getAction} from 'data/ACTIONS'
import Module from 'parser/core/Module'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Accordion, Message, Icon} from 'semantic-ui-react'
import Rotation from 'components/ui/Rotation'
import STATUSES from 'data/STATUSES'

const defaultSeverityTiers = {
	1: SEVERITY.MINOR,
}

const EXPECTED_CASTS = [
	{...getAction(ACTIONS.CLERIC_STANCE.id), name: 'GCD', count: 6},
	{...getAction(ACTIONS.BIO_II.id), count: 1},
	{...getAction(ACTIONS.MIASMA.id), count: 1},
	{...getAction(ACTIONS.SHADOW_FLARE.id),
		count: 1,
		content: <Fragment>
		Try to land a <ActionLink {...ACTIONS.SHADOW_FLARE} /> during <ActionLink {...ACTIONS.CLERIC_STANCE} /> if both will be available at the same time. Avoid casting  <ActionLink {...ACTIONS.SHADOW_FLARE} /> right before  <ActionLink {...ACTIONS.CLERIC_STANCE} />
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

	_expectedBuffGcds = 5
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
		if (cooldownRemaining - (STATUSES.CLERIC_STANCE.duration * 1000) < 0) {
			console.log('usable')
			return true
		} if ((cooldown * 1000 - cooldownRemaining) < 2 * this.gcd.getEstimate()) {
			console.log('could have used')
			return true
		}
		return false
	}

	_onEnd() {
		this._buffStart = null
	}

	_onComplete() {
		EXPECTED_CASTS.forEach(({id, name, icon, count, tiers, why}) => {
			const expected = Object.keys(this._buffRotations).length * count
			const actual =  Object.values(this._buffRotations).reduce(
				// don't count extra casts beyond what is expected per rotation
				(total, current) => total + Math.min(
					this._getCastsPerRotation(current, id),
					count
				)
				, 0)

			const diff = expected - actual
			if (diff < 1) {
				return
			}

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

	_getCastsPerRotation(rotation, id) {
		return rotation.filter(
			event => id === ACTIONS.CLERIC_STANCE.id
				// edge case for gcds
				? getAction(event.ability.guid).onGcd
				: event.ability.guid === +id
		).length
	}

	output() {
		const panels = Object.entries(this._buffRotations)
			.map(([timestamp, rotation]) => {
				return ({
					key: timestamp,
					title: {
						content: <Fragment>
							{[
								this.parser.formatTimestamp(timestamp),
								...EXPECTED_CASTS.map(({id, name, count}) => {
									if (id === ACTIONS.SHADOW_FLARE.id
									&& !this._potentialShadowFlareUsages.includes(+timestamp)) {
										return null
									}

									return `${this._getCastsPerRotation(rotation, id)} / ${count} ${name}${count !== 1 ? 's' : ''} `
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
						<div>Below is a detailed overview of GCD usage during Cleric Stance.</div>
						<div>Since Cleric Stance only contributes to like 1% of your overall total DPS, it is not that important.</div>
						<div>However, it is still good practice to maximize its usage.</div>
						<div>Shadow Flare will be shown if it is available during the Cleric Stance window.</div>
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
