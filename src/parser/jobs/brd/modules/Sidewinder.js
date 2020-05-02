/**
 * @author Ririan
 */
import React from 'react'
import {Trans, Plural, NumberFormat} from '@lingui/react'
import {t} from '@lingui/macro'
import {List, Button, Label, Icon, Message} from 'semantic-ui-react'
import Module from 'parser/core/Module'
import {getDataBy} from 'data'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import {matchClosest} from 'utilities'

// All of Bards DoTs
const DOTS = [
	STATUSES.CAUSTIC_BITE.id,
	STATUSES.STORMBITE.id,
	STATUSES.VENOMOUS_BITE.id,
	STATUSES.WINDBITE.id,
]

const DHIT_MOD = 1.25

const TRAIT_STRENGTH = 0.20

const MAX_SHADOWBITE_POTENCY = ACTIONS.SHADOWBITE.potency[2]
const MAX_SIDEWINDER_POTENCY = ACTIONS.SIDEWINDER.potency[2]

export default class Sidewinder extends Module {
	static handle = 'sidewinder'
	static title = t('brd.sidewinder.title')`Sidewinders and Shadowbites`
	static dependencies = [
		'suggestions',
		'timeline',
		'enemies',
		'additionalStats',
	]

	//This is used to determine the severity of their mistakes
	_notBothDotsPotencyLoss = 0
	_singleTargetShadowbitesPotencyLoss = 0

	_badCasts = []

	constructor(...args) {
		super(...args)

		this.addEventHook('cast', {
			by: 'player',
			abilityId: ACTIONS.SIDEWINDER.id,
		}, this._onSidewinderCast)

		this.addEventHook('complete', this._onComplete)

		this.addEventHook('normaliseddamage', {
			by: 'player',
			abilityId: ACTIONS.SHADOWBITE.id,
		}, this._onShadowbiteDamage)
	}

	_getDotsOnEnemy(enemy) {
		const dotsApplied = []
		if (enemy) {
			for (const dotId of DOTS) {
				if (enemy.hasStatus(dotId)) {
					dotsApplied.push(dotId)
				}
			}
		}
		return dotsApplied
	}

	//For some reason, shadowbite's cast target doesn't work properly in dungeon trash pulls so we gotta do it the hard way
	_onShadowbiteDamage(event) {
		if (event.hitCount === 0) {
			// Shadowbite did not hit any targets - action ghosted
			return
		}

		const potencyDamageRatio = this.additionalStats.potencyDamageRatio
		const rawDamage = this._getRawDamage(event.confirmedEvents[0])

		// We get the approximated potency and then match to the closest real potency
		const approximatedPotency = rawDamage * 100 / potencyDamageRatio
		const potency = matchClosest(ACTIONS.SHADOWBITE.potency, approximatedPotency)

		// We then infer the amount of stacks
		const dotsApplied = ACTIONS.SHADOWBITE.potency.indexOf(potency)

		const shadowbiteDamageEvent = {
			...event,
			abilityId: event.ability.guid,
			isSingleTargetShadowbite: event.hitCount === 1,
			hasBothDots: dotsApplied > 1,
			// Due to varience, a guess can be less then the actual raw damage, so we have to check to make sure they are actually losing damage first
			missedDamage: event.hitCount * (dotsApplied < 2 ? (MAX_SHADOWBITE_POTENCY * potencyDamageRatio / 100) : 0),
			missedPotency: event.hitCount * (MAX_SHADOWBITE_POTENCY - ACTIONS.SHADOWBITE.potency[dotsApplied]),
			targetsHit: event.hitCount,
			dotsApplied,
		}

		this._notBothDotsPotencyLoss += MAX_SHADOWBITE_POTENCY - matchClosest(ACTIONS.SHADOWBITE.potency, rawDamage * 100 / potencyDamageRatio)

		if (shadowbiteDamageEvent.isSingleTargetShadowbite) {
			const missedPotency = ACTIONS.SIDEWINDER.potency[dotsApplied] - ACTIONS.SHADOWBITE.potency[dotsApplied]
			shadowbiteDamageEvent.missedDamage += missedPotency * potencyDamageRatio / 100
			shadowbiteDamageEvent.missedPotency += missedPotency

			this._singleTargetShadowbitesPotencyLoss += missedPotency
			this._badCasts.push(shadowbiteDamageEvent)
		} else if (!shadowbiteDamageEvent.hasBothDots) {
			this._badCasts.push(shadowbiteDamageEvent)
		}
	}

	_onSidewinderCast(event) {
		const target = this.enemies.getEntity(event.targetID)
		const dotsApplied = this._getDotsOnEnemy(target)

		if (dotsApplied.length < 2) {
			const potencyDamageRatio = this.additionalStats.potencyDamageRatio
			const thisPotency = ACTIONS.SIDEWINDER.potency[dotsApplied.length]
			this._notBothDotsPotencyLoss += MAX_SIDEWINDER_POTENCY - thisPotency

			this._badCasts.push({
				...event,
				abilityId: event.ability.guid,
				dotsApplied: dotsApplied.length,
				isSingleTargetShadowbite: false,
				hasBothDots: false,
				missedDamage:  (MAX_SIDEWINDER_POTENCY * potencyDamageRatio / 100) - (thisPotency * potencyDamageRatio / 100),
				missedPotency: MAX_SIDEWINDER_POTENCY - thisPotency,
				targetsHit: 1,
			})
		}
	}

	_onComplete() {
		if (!this._badCasts.length) {
			return
		}

		this._badCasts.sort((c1, c2) => c1.timestamp - c2.timestamp)

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SIDEWINDER.icon,
			content: <Trans id="brd.sidewinder.suggestion.not-both-dots">
		Only use <ActionLink {...ACTIONS.SIDEWINDER}/> and <ActionLink {...ACTIONS.SHADOWBITE}/> when you have both <ActionLink {...ACTIONS.CAUSTIC_BITE}/> and <ActionLink {...ACTIONS.STORMBITE}/> active on the target. Remember that a DoT doesn't apply as soon as you cast it, so you have to wait for it to apply before casting <ActionLink showIcon={false} {...ACTIONS.SIDEWINDER}/> or <ActionLink showIcon={false} {...ACTIONS.SHADOWBITE}/>.
			</Trans>,
			tiers: {
				1110: SEVERITY.MAJOR,
				480: SEVERITY.MEDIUM,
				160: SEVERITY.MINOR,
			},
			value: this._notBothDotsPotencyLoss,
			why: <Trans id="brd.sidewinder.suggestion.not-both-dots.reason">
				{this._notBothDotsPotencyLoss} potency lost to casts on targets missing DoTs
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.SIDEWINDER.icon,
			content: <Trans id="brd.sidewinder.suggestion.single-target-shadowbite">
			Only cast <ActionLink {...ACTIONS.SHADOWBITE}/> when it will hit multiple targets. Otherwise you lose potency compared to casting <ActionLink {...ACTIONS.SIDEWINDER}/> instead.
			</Trans>,
			tiers: {
				200: SEVERITY.MAJOR,
				100: SEVERITY.MEDIUM,
				40: SEVERITY.MINOR,
			},
			value: this._singleTargetShadowbitesPotencyLoss,
			why: <Trans id="brd.sidewinder.suggestion.single-target-shadowbite.reason">
				{this._singleTargetShadowbitesPotencyLoss} potency lost on single target casts of <ActionLink {...ACTIONS.SHADOWBITE}/>
			</Trans>,
		}))
	}

	_createTimelineButton(timestamp) {
		return <Button
			circular
			compact
			icon="time"
			size="small"
			floated="left"
			onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp - this.parser.fight.start_time)}
			content={this.parser.formatTimestamp(timestamp)}
		/>
	}

	output() {
		if (!this._badCasts.length) {
			return
		}

		let totalPotencyLost = 0
		// Builds a list item for each incorrect cast
		const items = this._badCasts.map(cast => {
			totalPotencyLost += cast.missedPotency

			return <List.Item key={cast.timestamp}>
				{this._createTimelineButton(cast.timestamp)}
				<List.Content verticalAlign="middle">
					{this._createIssueTag(cast)} <Label horizontal size="small" color="red" pointing="left"><Trans id="brd.sidewinder.list.missed-potency"><Icon name="arrow down"/>Lost {this._formatDamageNumber(cast.missedPotency)} potency</Trans></Label>
				</List.Content>
			</List.Item>
		})
		// Output is a List, where every item is an incorrect cast
		return <>
			<List divided relaxed>
				{items}
			</List>
			<Message info attached="bottom"><Trans id="brd.sidewinder.total-mistakes"><Plural value={this._badCasts.length} one="# mistake" other="# mistakes"/> lost a total of <strong>{this._formatDamageNumber(totalPotencyLost)}</strong> potency</Trans></Message>
		</>
	}

	_createIssueTag(cast) {
		const ability = getDataBy(ACTIONS, 'id', cast.abilityId)
		let issue = <></>
		if (cast.dotsApplied < 2) {
			if (ability === ACTIONS.SIDEWINDER) {
				issue = <Trans id="brd.sidewinder.list.sidewinder.missing-dots">
					<ActionLink {...ability}/> was cast with <Plural value={cast.dotsApplied} one="only one DoT" other="no DoTs"/> applied to the target.
				</Trans>

			} else {
				issue = <Trans id="brd.sidewinder.list.shadowbite.missing-dots">
					<ActionLink {...ability}/> was cast with <Plural value={cast.dotsApplied} one="only one DoT" other="no DoTs"/> applied to the target and <Plural value={cast.targetsHit} one="only hit a single enemy" other ="hit # enemies"/>.
				</Trans>
			}

		} else if (cast.isSingleTargetShadowbite) {
			issue = <Trans id="brd.sidewinder.list.shadowbite.one-target">
				<ActionLink {...ability}/> only hit a single enemy.
			</Trans>
		}
		return issue
	}

	_formatDamageNumber(damage) {
		const truncDamage = Math.trunc(damage)
		return <NumberFormat value={truncDamage} />
	}

	_getRawDamage(event) {
		let fixedMultiplier = event.debugMultiplier

		// AND ALSO FOR RANGED TRAIT, BECAUSE APPARENTLY IT'S PHYSICAL DAMAGE ONLY REEEEEEEEEE
		fixedMultiplier = Math.trunc((fixedMultiplier + TRAIT_STRENGTH) * 100) / 100

		// We get the unbuffed damage
		let rawDamage = event.amount / fixedMultiplier

		// And then strip off critical hit and direct hit mods
		if (event.criticalHit) {
			rawDamage = Math.trunc(rawDamage / this.additionalStats.critMod)
		}

		if (event.directHit) {
			rawDamage = Math.trunc(rawDamage / DHIT_MOD)
		}
		return rawDamage
	}
}
