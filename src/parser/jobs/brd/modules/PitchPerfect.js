/**
 * @author Yumiya
 */
import React from 'react'
import Module from 'parser/core/Module'
import {Accordion, Icon, Message, List} from 'semantic-ui-react'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosest} from 'utilities'

import styles from './PitchPerfect.module.css'

const DOT_TICK_FREQUENCY = 3000 // 3s
const SONG_DURATION = 30000 // 30s
const ANIMATION_LOCK = 700 // 700ms (arbitrary, fite me)

const PP2_THRESHOLD = 61 // 61% crit rate
const CONVERSION_FACTOR = 0.1

const DHIT_MOD = 1.25

const DISEMBOWEL_STRENGTH = 0.05
const TRAIT_STRENGTH = 0.20

// Where's the lazy scale again?
const PP = {
	1: 1,
	2: 2,
	3: 3,
}

// Issues
const NONE = 0
const PP2_ON_LOW_CRIT = 1
const PP1_NOT_AT_END = 2

export default class PitchPerfect extends Module {
	static handle = 'pitchPerfect'
	static title = 'Pitch Perfect'
	static dependencies = [
		'additionalStats',
		'downtime',
		'enemies',
		'suggestions',
		'util',
	]

	_enemies = {}
	_lastWMCast = undefined

	_ppEvents = []

	constructor(...args) {
		super(...args)

		this.addHook('damage', {
			by: 'player',
			abilityId: ACTIONS.PITCH_PERFECT.id,
		}, this._onPPDamage)

		this.addHook('pitchPerfect', this._onPPEvent)

		this.addHook('damage', {
			by: 'player',
			abilityId: [STATUSES.CAUSTIC_BITE.id, STATUSES.STORMBITE.id],
			tick: true,
		}, this._onDotTick)

		this.addHook('cast', {
			by: 'player',
			abilityId: ACTIONS.THE_WANDERERS_MINUET.id,
		}, this._onWMCast)

		this.addHook('complete', this._onComplete)

	}

	_onDotTick(event) {
		// Keeping track of the dot tick on each enemy
		const enemy = this._getEnemy(event.targetID)

		enemy.tick[event.ability.guid] = event

	}

	_onWMCast(event) {
		this._lastWMCast = event
	}

	_onPPDamage(event) {
		const potencyDamageRatio = this.additionalStats.potencyDamageRatio

		let fixedMultiplier = event.debugMultiplier

		// Band-aid fix for disembowel (why, oh, why)
		if (this.enemies.getEntity(event.targetID).hasStatus(STATUSES.PIERCING_RESISTANCE_DOWN.id)) {
			fixedMultiplier = Math.trunc((fixedMultiplier + DISEMBOWEL_STRENGTH) * 100) / 100
		}
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

		// We get the approximated potency and then match to the closest real potency
		const approximatedPotency = rawDamage * 100 / potencyDamageRatio
		const potency = matchClosest(ACTIONS.PITCH_PERFECT.potency, approximatedPotency)

		// We then infer the amount of stacks
		const stacks = ACTIONS.PITCH_PERFECT.potency.indexOf(potency) + 1

		// And finally we fabricate the event
		this.parser.fabricateEvent({
			...event,
			type: 'pitchPerfect',
			stacks: stacks,
			rawDamage: rawDamage,
		})
	}

	_onPPEvent(event) {
		const enemy = this._getEnemy(event.targetID)
		const wm = this._lastWMCast

		if (event.stacks === undefined) {
			//Fuck, abort!
			return
		}

		const ppEvent = {
			damageEvent: event,
			issue: NONE,
			timeLeftOnSong: Math.max(wm.timestamp + SONG_DURATION - event.timestamp, 0),
			critOnDot: {
				[STATUSES.CAUSTIC_BITE.id]: 0,
				[STATUSES.STORMBITE.id]: 0,
			},
			lastTickOnEnemy: enemy.lastTick,
			get stacks() { return this.damageEvent && this.damageEvent.stacks || undefined },
			get timestamp() { return this.damageEvent && this.damageEvent.timestamp },
		}

		this._ppEvents.push(ppEvent)

		// Only an issue if there are dot ticks left on the song and sufficient time to use PP (animation lock)
		// TODO: Consider pre-downtime case
		if (ppEvent.lastTickOnEnemy + DOT_TICK_FREQUENCY >= wm.timestamp + SONG_DURATION - 2 * ANIMATION_LOCK) {
			return
		}

		// We write down the crit on each dot, to provide the information later
		ppEvent.critOnDot[STATUSES.CAUSTIC_BITE.id] = enemy.tick[STATUSES.CAUSTIC_BITE.id] && enemy.tick[STATUSES.CAUSTIC_BITE.id].expectedCritRate * CONVERSION_FACTOR
		ppEvent.critOnDot[STATUSES.STORMBITE.id] = enemy.tick[STATUSES.STORMBITE.id] && enemy.tick[STATUSES.STORMBITE.id].expectedCritRate * CONVERSION_FACTOR

		// If crit is above threshold for PP2
		// Using PP1 when not at the end of the song is not ideal
		if (
			enemy.tick[STATUSES.CAUSTIC_BITE.id]
			&& enemy.tick[STATUSES.STORMBITE.id]
			&& enemy.tick[STATUSES.CAUSTIC_BITE.id].expectedCritRate * CONVERSION_FACTOR > PP2_THRESHOLD
			&& enemy.tick[STATUSES.STORMBITE.id].expectedCritRate * CONVERSION_FACTOR > PP2_THRESHOLD
		) {
			// Using PP1 when not at the end of the song is not ideal
			if (event.stacks === PP[1]) {
				ppEvent.issue = PP1_NOT_AT_END
			}
		// Using PP2 when crit is below the threshold is not ideal
		} else if (event.stacks === PP[2]) {

			ppEvent.issue = PP2_ON_LOW_CRIT

		// Using PP1 when not at the end of the song is not ideal
		} else if (event.stacks === PP[1]) {

			ppEvent.issue = PP1_NOT_AT_END

		}
	}

	_onComplete() {
		// We remove bad PPs that were used because of downtime
		this._cleanUpPPs()

		const badPPs = this._ppEvents.filter(pp => pp.issue !== NONE).length

		if (badPPs === 0) {
			// Good job!
			return
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.PITCH_PERFECT.icon,
			content: <>
				Use {ACTIONS.PITCH_PERFECT.name} at <strong>3 stacks</strong>, unless the critical hit rate on your DoTs is greater than <strong>{PP2_THRESHOLD}%</strong>. Only use it at <strong>1 stack</strong> when there are no more DoT ticks before <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} /> ends. More information in the <a href="javascript:void(0);" onClick={() => this.parser.scrollTo(this.constructor.handle)}>{this.constructor.title}</a> module below.
			</>,
			tiers: {
				8: SEVERITY.MAJOR,
				5: SEVERITY.MEDIUM,
				2: SEVERITY.MINOR,
			},
			value: badPPs,
			why: <>
				{badPPs} casts of {ACTIONS.PITCH_PERFECT.name} with the wrong amount of stacks.
			</>,
		}))
	}

	output() {
		const badPPs = this._ppEvents.filter(pp => pp.issue !== NONE)

		if (badPPs.length === 0) {
			return
		}

		// Builds a panel for each pp event
		const panels = badPPs.map(pp => {

			const panelProperties = {
				pp: pp,
				tuples: [],
			}

			// For each PP issue
			if (pp.issue === PP2_ON_LOW_CRIT) {
				panelProperties.tuples.push({
					issue: <>
						When your critical hit rate is lower than or equal to <strong>{PP2_THRESHOLD}%</strong> on both your DoTs, {ACTIONS.PITCH_PERFECT.name} should be used at <strong>3 stacks</strong>.
					</>,
					reason: <>
						A {ACTIONS.PITCH_PERFECT.name} at 3 stacks has the highest <strong>potency per stack</strong> value, with 140 potency per stack.
						<br/>
						Using {ACTIONS.PITCH_PERFECT.name} at 2 stacks is only optimal when your critical hit rate is greater than <strong>{PP2_THRESHOLD}%</strong> on both your DoTs.
						<br/>
						This happens because both your DoTs can give you Repertoire procs at the same time. If you already have 2 stacks on your bank, getting a double proc wastes one stack.
						At <strong>{PP2_THRESHOLD}%</strong> critical hit rate or higher, you are more likely to get a double proc and waste a stack than not.
					</>,
				})
			} else if (pp.issue === PP1_NOT_AT_END) {
				panelProperties.tuples.push({
					issue: <>
						{ACTIONS.PITCH_PERFECT.name} should only be used at 1 stack when you know there are no more DoT ticks left until the end of <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} />.
					</>,
					reason: <>
						Any left over stack is lost when your song ends, so using whatever stacks you have before it ends is always a gain.
					</>,
				})
			}

			// Then builds the panel and returns it in the mapping function
			return this._buildPanel(panelProperties)

		})

		// Output is an Accordion made with panels, one for each wrong PP event
		return <Accordion
			exclusive={false}
			panels={panels}
			styled
			fluid
		/>
	}

	// Builds a panel for each cast of Pitch Perfect and its respectives issues, to be provided to the final Accordion
	// Each panel has the following components:
	// - A title, containing:
	//    - timestamp
	//    - amount of stacks
	// - A list of issues, containing:
	//    - issue description (tuples[].issue)
	// - A list of reasons, containing:
	//    - the reason explaining why each issue is... an issue (tuples[].reason)
	// - A message block, containing:
	//    - information about critical hit rate and time left on song
	_buildPanel({pp, tuples}) {

		// Default panel title
		const defaultTitle = <>
			{this.util.formatTimestamp(pp.timestamp)} - {ACTIONS.PITCH_PERFECT.name} used at {pp.stacks} stack{pp.stacks > 1 && 's'}
		</>

		// List of issues
		const issueElements = tuples && tuples.length && tuples.map(t => {
			return t.issue && <Message key={tuples.indexOf(t)} error>
				<Icon name={'remove'}/>
				<span>{t.issue}</span>
			</Message>
		}) || undefined

		// List of reasons
		const reasonElements = tuples && tuples.length && <div className={styles.description}>
			<List bulleted relaxed>
				{ tuples.map(t => {
					return <List.Item key={tuples.indexOf(t)}>{t.reason}</List.Item>
				})
				}
			</List>
		</div> || undefined

		// Information
		const informationElements = <Message info>
			<List>
				<List.Content>
					<List.Item>
						<Icon name={'exclamation circle'}/>
						<strong>{this.util.formatDecimal(pp.critOnDot[STATUSES.CAUSTIC_BITE.id], 1)}%</strong> critical hit rate on <StatusLink {...STATUSES.CAUSTIC_BITE} />
					</List.Item>
					<List.Item>
						<Icon name={'exclamation circle'}/>
						<strong>{this.util.formatDecimal(pp.critOnDot[STATUSES.STORMBITE.id], 1)}%</strong> critical hit rate on <StatusLink {...STATUSES.STORMBITE} />
					</List.Item>
					<List.Item>
						<Icon name={'hourglass'}/>
						<strong>{this.util.milliToSeconds(pp.timeLeftOnSong)}</strong> second{pp.timeLeftOnSong !== 1000 && 's'} left on <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} />
					</List.Item>
				</List.Content>
			</List>
		</Message> || undefined

		// Builds the full panel
		return {
			key: pp.timestamp,
			title: {
				content: <>
					<Icon
						name={'remove'}
						className={'text-error'}
					/>
					{defaultTitle}
				</>,
			},
			content: {
				content: <>
					{issueElements}
					{reasonElements}
					{informationElements}
				</>,
			},
		}
	}

	_getEnemy(targetId) {

		if (!this._enemies[targetId]) {
			this._enemies[targetId] = {
				tick: {
					[STATUSES.CAUSTIC_BITE.id]: undefined,
					[STATUSES.STORMBITE.id]: undefined,
				},
				get lastTick() {
					return this.tick[STATUSES.CAUSTIC_BITE.id]
						&& this.tick[STATUSES.CAUSTIC_BITE.id].timestamp
						|| this.tick[STATUSES.STORMBITE.id]
						&& this.tick[STATUSES.STORMBITE.id].timestamp
				},
			}

		}
		return this._enemies[targetId]
	}

	_cleanUpPPs() {

		for (const pp of this._ppEvents) {
			if (this.downtime.isDowntime(pp.lastTickOnEnemy + DOT_TICK_FREQUENCY + ANIMATION_LOCK)) {
				this._ppEvents.splice(this._ppEvents.indexOf(pp), 1)
			}
		}
	}

}
