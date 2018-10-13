/**
 * @author Yumiya
 */
import React, {Fragment} from 'react'
import Module from 'parser/core/Module'
import {Accordion, Icon, Message, List} from 'semantic-ui-react'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import styles from './Barrage.module.css'

const DOT_TICK_FREQUENCY = 3000 // 3s
const SONG_DURATION = 30000 // 30s
const ANIMATION_LOCK = 700 // 700ms (arbitrary, fite me)

const PP2_THRESHOLD = 61 // 61% crit rate
const CONVERSION_FACTOR = 0.1

// Where's the lazy scale again?
const PP = {
	1: 1,
	2: 2,
	3: 3,
}

// Issues
const NONE = 0
const PP3_ON_HIGH_CRIT = 1
const PP2_ON_LOW_CRIT = 2
const PP1_NOT_AT_END = 3

export default class PitchPerfectUsage extends Module {
	static handle = 'ppUsage'
	static title = 'Pitch Perfect'
	static dependencies = [
		'pitchPerfect', // eslint-disable-line xivanalysis/no-unused-dependencies
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
		// Keeping track of the first dot tick of each enemy
		// We only need to know when the first tick happens, since the frequency is known
		const enemy = this._getEnemy(event.targetID)

		enemy.tick[event.ability.guid] = event

	}

	_onWMCast(event) {
		this._lastWMCast = event
	}

	_onPPDamage(event) {
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
			get stacks() { return this.damageEvent && this.damageEvent.stacks || undefined },
			get timestamp() { return this.damageEvent && this.damageEvent.timestamp },
		}

		this._ppEvents.push(ppEvent)

		// Only an issue if there are dot ticks left on the song and sufficient time to use PP (animation lock)
		if (enemy.lastTick + DOT_TICK_FREQUENCY < wm.timestamp + SONG_DURATION - ANIMATION_LOCK) {

			// We write down the crit on each dot, to provide the information later
			ppEvent.critOnDot[STATUSES.CAUSTIC_BITE.id] = enemy.tick[STATUSES.CAUSTIC_BITE.id] && enemy.tick[STATUSES.CAUSTIC_BITE.id].expectedCritRate * CONVERSION_FACTOR
			ppEvent.critOnDot[STATUSES.STORMBITE.id] = enemy.tick[STATUSES.STORMBITE.id] && enemy.tick[STATUSES.STORMBITE.id].expectedCritRate * CONVERSION_FACTOR

			// If crit is above threshold for PP2
			if (
				enemy.tick[STATUSES.CAUSTIC_BITE.id]
				&& enemy.tick[STATUSES.STORMBITE.id]
				&& enemy.tick[STATUSES.CAUSTIC_BITE.id].expectedCritRate * CONVERSION_FACTOR > PP2_THRESHOLD
				&& enemy.tick[STATUSES.STORMBITE.id].expectedCritRate * CONVERSION_FACTOR > PP2_THRESHOLD
			) {
				// Using PP3 when crit is above the threshold is not ideal
				if (event.stacks === PP[3]) {

					ppEvent.issue = PP3_ON_HIGH_CRIT

				// Using PP1 when not at the end of the song is not ideal
				} else if (event.stacks === PP[1]) {

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
	}

	_onComplete() {
		const badPPs = this._ppEvents.filter(pp => pp.issue !== NONE).length

		if (badPPs > 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: ACTIONS.PITCH_PERFECT.icon,
				content: <Fragment>
					Use {ACTIONS.PITCH_PERFECT.name} at <strong>3 stacks</strong>, unless the critical hit rate on your DoTs is greater than <strong>{PP2_THRESHOLD}%</strong>. Only use it at <strong>1 stack</strong> when there are no more DoT ticks before <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} /> ends. More information in the <a href="javascript:void(0);" onClick={() => this.parser.scrollTo(this.constructor.handle)}>{this.constructor.title}</a> module below.
				</Fragment>,
				tiers: {
					8: SEVERITY.MAJOR,
					5: SEVERITY.MEDIUM,
					2: SEVERITY.MINOR,
				},
				value: badPPs,
				why: <Fragment>
					{badPPs} casts of {ACTIONS.PITCH_PERFECT.name} with the wrong amount of stacks
				</Fragment>,
			}))
		}
	}

	output() {
		const badPPevents = this._ppEvents.filter(pp => pp.issue !== NONE)

		if (badPPevents.length === 0) {
			return
		}

		// Builds a panel for each barrage event
		const panels = badPPevents.map(pp => {

			const panelProperties = {
				pp: pp,
				tuples: [],
			}

			// If it's any kind of bad barrages:
			if (pp.issue === PP3_ON_HIGH_CRIT) {
				panelProperties.tuples.push({
					issue: <>
						When your critical hit rate is higher than <strong>{PP2_THRESHOLD}%</strong> on both your DoTs, {ACTIONS.PITCH_PERFECT.name} should be used at <strong>2 stacks</strong>.
					</>,
					reason: <>
						This happens because both your DoTs can give you Repertoire procs at the same time. If you already have 2 stacks on your bank, getting a double proc wastes one stack.
						At <strong>{PP2_THRESHOLD}%</strong> critical hit rate, you are more likely to get a double proc and waste a stack than not.
					</>,
				})
			} else if (pp.issue === PP2_ON_LOW_CRIT) {
				panelProperties.tuples.push({
					issue: <>
						When your critical hit rate is lower than or equal to <strong>{PP2_THRESHOLD}%</strong> on both your DoTs, {ACTIONS.PITCH_PERFECT.name} should be used at <strong>3 stacks</strong>.
					</>,
					reason: <>
						A {ACTIONS.PITCH_PERFECT.name} at 3 stacks has the highest <strong>potency per stack</strong> value, with 140 potency per stack.
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

		// Output is an Accordion made with panels, one for each barrage event
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
						<strong>{pp.critOnDot[STATUSES.CAUSTIC_BITE.id]}%</strong> critical hit rate on <StatusLink {...STATUSES.CAUSTIC_BITE} />
					</List.Item>
					<List.Item>
						<Icon name={'exclamation circle'}/>
						<strong>{pp.critOnDot[STATUSES.STORMBITE.id]}%</strong> critical hit rate on <StatusLink {...STATUSES.STORMBITE} />
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

}
