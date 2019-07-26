/**
 * @author Ririan
 */
import React from 'react'
import {Trans} from '@lingui/react'
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

	_amountOfBadSidewinders = 0
	_amountOfBadShadowbites = 0
	_amountOfSingleTargetShadowbites = 0
	//This is used to determine the severity of their mistakes
	_notBothDotsPotencyLoss = 0
	_singleTargetShadowbitesPotencyLoss = 0

	_badCasts = []
	_shadowbiteDamageTimestamps = new Map()

	constructor(...args) {
		super(...args)

		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.SIDEWINDER.id,
		}, this._onSidewinderCast)

		this.addHook('damage', {
			by: 'player',
			abilityId: ACTIONS.SHADOWBITE.id,
		}, this._onShadowbiteDamage)

		this.addHook('complete', this._onComplete)
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
		const potencyDamageRatio = this.additionalStats.potencyDamageRatio
		const rawDamage = this._getRawDamage(event)

		// We get the approximated potency and then match to the closest real potency
		const approximatedPotency = rawDamage * 100 / potencyDamageRatio
		const potency = matchClosest(ACTIONS.SHADOWBITE.potency, approximatedPotency)

		// We then infer the amount of stacks
		const dotsApplied = ACTIONS.SHADOWBITE.potency.indexOf(potency)

		const timestamp = event.timestamp
		const shadowbiteTimestampArray = this._shadowbiteDamageTimestamps.get(timestamp)

		const shadowbiteDamageEvent = {
			...event,
			abilityId: event.ability.guid,
			isSingleTargetShadowbite: false,
			hasBothDots: dotsApplied > 1,
			// Due to varience, a guess can be less then the actual raw damage, so we have to check to make sure they are actually losing damage first
			missedDamage: dotsApplied < 2 ? (MAX_SHADOWBITE_POTENCY * potencyDamageRatio / 100) : 0,
			missedPotency: MAX_SHADOWBITE_POTENCY - ACTIONS.SHADOWBITE.potency[dotsApplied],
			targetsHit: 0,
			dotsApplied,
		}

		this._notBothDotsPotencyLoss += MAX_SHADOWBITE_POTENCY - matchClosest(ACTIONS.SHADOWBITE.potency, rawDamage * 100 / potencyDamageRatio)

		if (!shadowbiteTimestampArray) {
			if (!shadowbiteDamageEvent.hasBothDots) {
				this._amountOfBadShadowbites++
				this._badCasts.push(shadowbiteDamageEvent)
			}
			this._shadowbiteDamageTimestamps.set(timestamp, [shadowbiteDamageEvent])
		} else {
			shadowbiteTimestampArray.push(shadowbiteDamageEvent)
		}
	}

	_onSidewinderCast(event) {
		const target = this.enemies.getEntity(event.targetID)
		const dotsApplied = this._getDotsOnEnemy(target)

		if (dotsApplied.length < 2) {
			this._amountOfBadSidewinders++

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
		const singleTargetShadowbites = this._checkForSingleTargetShadowbites()
		this._amountOfSingleTargetShadowbites = singleTargetShadowbites

		if (!this._badCasts.length) {
			return
		}

		const badSidewinders = this._amountOfBadSidewinders
		const badShadowbites = this._amountOfBadShadowbites

		if (badSidewinders || badShadowbites) {

			const badSidewinderCastElem = badSidewinders ? <>{badSidewinders} cast{badSidewinders !== 1 ? 's' : ''} of <ActionLink showIcon={false} {...ACTIONS.SIDEWINDER}/></> : null
			const badShadowbiteCastElem = badShadowbites ? <>{badShadowbites} cast{badShadowbites !== 1 ? 's' : ''} of <ActionLink showIcon={false} {...ACTIONS.SHADOWBITE}/></> : null
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
					{badSidewinderCastElem}{badSidewinders && badShadowbites ? ' and ' : ''}{badShadowbiteCastElem} without both DoTs applied lost a total of {this._formatDamageNumber(this._notBothDotsPotencyLoss)} potency over the course of the fight.
				</Trans>,
			}))
		}

		if (singleTargetShadowbites) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.SIDEWINDER.icon,
				content: <Trans id="brd.sidewinder.suggestion.single-target-shadowbite">
				Only cast <ActionLink {...ACTIONS.SHADOWBITE}/> when it will hit multiple targets.  Otherwise use <ActionLink {...ACTIONS.SIDEWINDER}/> instead.
				</Trans>,
				tiers: {
					200: SEVERITY.MAJOR,
					100: SEVERITY.MEDIUM,
					40: SEVERITY.MINOR,
				},
				value: this._singleTargetShadowbitesPotencyLoss,
				why: <Trans id="brd.sidewinder.suggestion..single-target-shadowbit.reason">
					<ActionLink showIcon={false} {...ACTIONS.SHADOWBITE}/> cast {singleTargetShadowbites} time{singleTargetShadowbites !== 1 ? 's' : ''} on a single target lost a total of {this._formatDamageNumber(this._singleTargetShadowbitesPotencyLoss)} potency compared to using <ActionLink showIcon={false} {...ACTIONS.SIDEWINDER}/> instead.
				</Trans>,
			}))
		}
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
			const ability = getDataBy(ACTIONS, 'id', cast.abilityId)
			let singleTargetItem
			let notBothDotsItem

			if (!cast.hasBothDots) {
				if (cast.dotsApplied) {
					notBothDotsItem =
							<Trans id="brd.sidewinder.list.one-dot">
								<ActionLink {...ability}/> was cast with only one DoT applied to the target {cast.targetsHit > 1 ? 'and hit ' + cast.targetsHit + ' enemies' : ''}
							</Trans>

				} else {
					notBothDotsItem = <Trans id="brd.sidewinder.list.no-dots">
						<ActionLink {...ability}/> was cast with no DoTs applied to the target {cast.targetsHit > 1 ? 'and hit ' + cast.targetsHit + ' enemies' : ''}
					</Trans>

				}
			}
			if (cast.isSingleTargetShadowbite) {
				singleTargetItem = <Trans id="brd.sidewinder.list.single-target-shadowbite">
					{!cast.hasBothDots ? ' and' : <ActionLink {...ability}/>}  only hit a single enemy
				</Trans>
			}

			totalPotencyLost += cast.missedPotency

			return <List.Item key={cast.timestamp}>
				{this._createTimelineButton(cast.timestamp)}
				<List.Content verticalAlign="middle">
					{notBothDotsItem} {singleTargetItem}. <Label horizontal size="small" color="red" pointing="left"><Trans id="brd.sidewinder.list.missed-potency"><Icon name="arrow down"/>Lost {this._formatDamageNumber(cast.missedPotency)} potency</Trans></Label>
				</List.Content>
			</List.Item>
		})
		// Output is a List, where every item is an incorrect cast
		return <>
		<List divided relaxed>
			{items}
		</List>
		<Message warning attached="bottom"><Trans id="brd.sidewinder.total-mistakes">{this._badCasts.length} mistake{this._badCasts.length !== 1 ? 's' : ''} lost a total of {this._formatDamageNumber(totalPotencyLost)} potency over the course of the fight</Trans></Message>
		</>
	}

	_formatDamageNumber(damage) {
		const truncDamage = Math.trunc(damage)
		return truncDamage.toLocaleString()
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

	_checkForSingleTargetShadowbites() {
		let singleTargetAmount = 0
		let needsSort = false

		this._shadowbiteDamageTimestamps.forEach(eventArray => {
			const damageEvent = eventArray[0]
			const dotsApplied = damageEvent.dotsApplied
			if (eventArray.length === 1) {
				singleTargetAmount++

				damageEvent.isSingleTargetShadowbite = true

				const missedPotency = ACTIONS.SIDEWINDER.potency[dotsApplied] - ACTIONS.SHADOWBITE.potency[dotsApplied]
				damageEvent.missedDamage += missedPotency * this.additionalStats.potencyDamageRatio / 100
				damageEvent.missedPotency += missedPotency

				this._singleTargetShadowbitesPotencyLoss += missedPotency
				if (damageEvent.hasBothDots) {
					needsSort = true
					this._badCasts.push(damageEvent)
				}
			} else if (!damageEvent.hasBothDots) {
				let lostDamage = 0
				for (const damageEvent of eventArray) {
					lostDamage += damageEvent.missedDamage
				}
				damageEvent.missedDamage = lostDamage
				damageEvent.missedPotency *= eventArray.length
			}
			damageEvent.targetsHit = eventArray.length
		})

		if (needsSort) {
			this._badCasts.sort((cast1, cast2) => {
				if (cast1.timestamp > cast2.timestamp) {
					return 1
				} if (cast1.timestamp < cast2.timestamp) {
					return -1
				}
				return 0
			})
		}

		return singleTargetAmount
	}

}
