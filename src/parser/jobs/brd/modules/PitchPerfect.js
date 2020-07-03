/**
 * @author Yumiya
 */
import {Trans, Plural} from '@lingui/react'
import {t} from '@lingui/macro'
import React from 'react'
import Module from 'parser/core/Module'
import {Accordion, Icon, Message, List, Button, Label} from 'semantic-ui-react'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {matchClosest} from 'utilities'

import styles from './PitchPerfect.module.css'

const DOT_TICK_FREQUENCY = 3000 // 3s
const SONG_DURATION = 30000 // 30s
const ANIMATION_LOCK = 700 // 700ms (arbitrary, fite me)

const CONVERSION_FACTOR = 0.1

const DHIT_MOD = 1.25

const TRAIT_STRENGTH = 0.20

// Where's the lazy scale again?
const PP = {
	1: 1,
	2: 2,
	3: 3,
}

const PP_POTENCY = ACTIONS.PITCH_PERFECT.potency
const PP_MAX_POTENCY = PP_POTENCY[2]

// Issues
const NONE = 0
const PP_CAST_WIHTOUT_MAX_STACKS = 1
const PP_NOT_CAST_AT_END = 2

export default class PitchPerfect extends Module {
	static handle = 'pitchPerfect'
	static title = t('brd.pitch-perfect.title')`Pitch Perfect`
	static dependencies = [
		'additionalStats',
		'downtime',
		'suggestions',
		'brokenLog',
		'timeline',
	]

	_enemies = {}
	_lastWMCast = undefined

	_lostPotencyFromStacks = 0
	_lostPotencyFromMissedCast = [0, 0]
	_ppEvents = []

	constructor(...args) {
		super(...args)

		this.addEventHook('damage', {
			by: 'player',
			abilityId: ACTIONS.PITCH_PERFECT.id,
		}, this._onPPDamage)

		this.addEventHook('pitchPerfect', this._onPPEvent)

		this.addEventHook('damage', {
			by: 'player',
			abilityId: [STATUSES.CAUSTIC_BITE.id, STATUSES.STORMBITE.id],
			tick: true,
		}, this._onDotTick)

		this.addEventHook('cast', {
			by: 'player',
			abilityId: ACTIONS.THE_WANDERERS_MINUET.id,
		}, this._onWMCast)

		this.addEventHook('complete', this._onComplete)

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
		const potency = matchClosest(PP_POTENCY, approximatedPotency)

		// We then infer the amount of stacks
		const stacks = PP_POTENCY.indexOf(potency) + 1

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

		if (wm === undefined) {
			//The only time I have encounted this is from broken logs
			this.brokenLog.trigger(this, 'no previous wm cast', (
				<Trans id="brd.pitch-perfect.trigger.no-wm-cast">
					<ActionLink {...ACTIONS.PITCH_PERFECT}/> was used when there was no cast of <ActionLink {...ACTIONS.THE_WANDERERS_MINUET}/> before hand.
				</Trans>
			))
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
		if (ppEvent.lastTickOnEnemy + DOT_TICK_FREQUENCY >= wm.timestamp + SONG_DURATION - 2 * ANIMATION_LOCK) {
			return
		}

		// We write down the crit on each dot, to provide the information later
		ppEvent.critOnDot[STATUSES.CAUSTIC_BITE.id] = enemy.tick[STATUSES.CAUSTIC_BITE.id] && enemy.tick[STATUSES.CAUSTIC_BITE.id].expectedCritRate * CONVERSION_FACTOR
		ppEvent.critOnDot[STATUSES.STORMBITE.id] = enemy.tick[STATUSES.STORMBITE.id] && enemy.tick[STATUSES.STORMBITE.id].expectedCritRate * CONVERSION_FACTOR
		if (event.stacks !== PP[3]) {
			ppEvent.lostPotency = PP_MAX_POTENCY - PP_POTENCY[event.stacks - 1]
			ppEvent.issue = PP_CAST_WIHTOUT_MAX_STACKS
		}
	}

	_onComplete() {
		// We remove bad PPs that were used because of downtime
		this._cleanUpPPs()

		const badPPs = this._ppEvents.filter(pp => pp.issue === PP_CAST_WIHTOUT_MAX_STACKS).length
		const missedPPs = this._ppEvents.filter(pp => pp.issue === PP_NOT_CAST_AT_END).length

		if (badPPs === 0 && missedPPs === 0) {
			// Good job!
			return
		}

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.PITCH_PERFECT.icon,
			content: <Trans id="brd.pitch-perfect.cast-without-stacks.suggestion">
				Use {ACTIONS.PITCH_PERFECT.name} at <strong>3 stacks</strong>. Only use it at <strong>2 or less stacks</strong> when there are no more DoT ticks before <ActionLink {...ACTIONS.THE_WANDERERS_MINUET}/> ends.
			</Trans>,
			tiers: {
				900: SEVERITY.MAJOR,
				400: SEVERITY.MEDIUM,
				150: SEVERITY.MINOR,
			},
			value: this._lostPotencyFromStacks,
			why: <Trans id="brd.pitch-perfect.cast-without-stacks.suggestion.reason">
				<Plural value={badPPs} one="# cast" other="# casts"/> of {ACTIONS.PITCH_PERFECT.name} with the wrong amount of stacks.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.PITCH_PERFECT.icon,
			content: <Trans id="brd.pitch-perfect.no-cast-at-end.suggestion">
				Use any stacks you have of {ACTIONS.PITCH_PERFECT.name} after there are no more DoT ticks before <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} /> ends.
			</Trans>,
			tiers: {
				8: SEVERITY.MAJOR,
				5: SEVERITY.MEDIUM,
				2: SEVERITY.MINOR,
			},
			value: missedPPs,
			why: <Trans id="brd.pitch-perfect.no-cast-at-end.suggestion.reason">
				You might have missed up to <Plural value={missedPPs} one="# cast" other="# casts"/> of {ACTIONS.PITCH_PERFECT.name}.
			</Trans>,
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

			if (pp.issue === PP_CAST_WIHTOUT_MAX_STACKS) {
				panelProperties.tuples.push({
					issue: <Trans id="brd.pitch-perfect.cast-without-max-stacks">
						<ActionLink {...ACTIONS.PITCH_PERFECT}/> should only be used below 3 stacks when you know there are no more DoT ticks left until the end of <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} />.
					</Trans>,
					reason: <Trans id="brd.pitch-perfect.cast-without-max-stacks.reason">
						<ActionLink {...ACTIONS.PITCH_PERFECT}/> potency is {this._formatPotency(PP_POTENCY[0])} at the first stack, {this._formatPotency(PP_POTENCY[1])} at the second, and {this._formatPotency(PP_POTENCY[2])} at the third and final stack, so you don't want to use it before the last one.
					</Trans>,
				})
			} else if (pp.issue === PP_NOT_CAST_AT_END) {
				panelProperties.tuples.push({
					issue: <Trans id="brd.pitch-perfect.cast-without-stacks">
						Before <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} /> ends, you should make sure to use <ActionLink {...ACTIONS.PITCH_PERFECT}/> regardless of the amount of stacks you have.
					</Trans>,
					reason: <Trans id="brd.pitch-perfect.cast-without-stacks.reason">
						Any left over stack is lost when your song ends, so using whatever stacks you have before it ends is always a gain.
					</Trans>,
				})
			}

			// Then builds the panel and returns it in the mapping function
			return this._buildPanel(panelProperties)

		})

		// Output is an Accordion made with panels, one for each wrong PP event
		return <>
			{ this._lostPotencyFromMissedCast[0] ?
				<Message attached="top">
					<Trans id="brd.pitch-perfect.estimate-note">
						<Label color="orange" size="tiny" pointing="right">NOTE:</Label> We do not have access to how many unused stacks you had at the end of {ACTIONS.THE_WANDERERS_MINUET.name}, these are times you might have had some.
					</Trans>
				</Message>: null
			}
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
			<Message attached="bottom" info>
				<List bulleted>
					<List.Content>
						{this._lostPotencyFromStacks ?
							<List.Item>
								<Trans id="brd.pitch-perfect.without-max-stacks.total-potency-lost">
									<Icon name={'remove'} className={'text-error'}/> Casting without max stacks lost you a total of <strong>{this._formatPotency(this._lostPotencyFromStacks)}</strong> potency
								</Trans>
							</List.Item> : null
						}
						{ this._lostPotencyFromMissedCast[0] ?
							<List.Item>
								<Trans id="brd.pitch-perfect.no-cast-at-end.total-potency-lost">
									<Icon name={'question'} className={'text-warning'}/> You might have lost between <strong>{this._formatPotency(this._lostPotencyFromMissedCast[0])} to {this._formatPotency(this._lostPotencyFromMissedCast[1])}</strong> potency from missing casts at the end of <ActionLink {...ACTIONS.THE_WANDERERS_MINUET}/>
								</Trans>
							</List.Item> : null
						}
					</List.Content>
				</List>
			</Message>
		</>
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
		let titleIconName = ''
		let titleIconClass = ''
		let titleElement = <></>
		let timeLeftElement = <></>
		let potencyLostElement = <></>
		let timestamp = 0

		if (pp.issue === PP_CAST_WIHTOUT_MAX_STACKS) {
			// Without Max Stacks Title
			titleElement = <Trans id="brd.pitch-perfect.cast-without-max-stacks.title">
				{ACTIONS.PITCH_PERFECT.name} used at <Plural value={pp.stacks} one="# stack" other="# stacks"/>.
			</Trans>
			titleIconName = 'remove'
			titleIconClass = 'text-error'

			// Witout Max Stacks timestamp for button
			timestamp = pp.timestamp

			// Without Max Stacks Information Elements
			timeLeftElement = <Trans id="brd.pitch-perfect.cast-without-max-stacks.time-left"><strong>{this.parser.formatDuration(pp.timeLeftOnSong)}</strong> left on <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} /></Trans>
			potencyLostElement = <Trans id="brd.pitch-perfect.cast-without-max-stacks.potency-lost"><strong>{this._formatPotency(PP_MAX_POTENCY - PP_POTENCY[pp.stacks - 1])}</strong> potency lost versus casting at max stacks</Trans>

		} else if (pp.issue === PP_NOT_CAST_AT_END) {
			// Not Cast At End Title
			titleElement = <Trans id="brd.pitch-perfect.not-cast-at-end.title">
				{ACTIONS.PITCH_PERFECT.name} might have been usable before the end of {ACTIONS.THE_WANDERERS_MINUET.name}.
			</Trans>
			titleIconName = 'question'
			titleIconClass = 'text-warning'

			// Witout Max Stacks timestamp for button
			timestamp = pp.timestamp + pp.timeLeftOnSong

			// Not Cast At End Information Elements
			timeLeftElement = <Trans id="brd.pitch-perfect.not-cast-at-end.time-left"><strong>{this.parser.formatDuration(pp.timeLeftOnSong)}</strong> left on <ActionLink {...ACTIONS.THE_WANDERERS_MINUET} /> after the last cast of <ActionLink {...ACTIONS.PITCH_PERFECT}/></Trans>
			potencyLostElement = <Trans id="brd.pitch-perfect.not-cast-at-end.potency-lost"><strong>{this._formatPotency(PP_POTENCY[0])} to {this._formatPotency(PP_MAX_POTENCY)}</strong> potency potentially lost</Trans>
		}

		const issueElements = tuples && tuples.length && tuples.map(t => {
			return t.issue && <Message key={tuples.indexOf(t)} error={pp.issue === PP_CAST_WIHTOUT_MAX_STACKS} warning={pp.issue === PP_NOT_CAST_AT_END}>
				<Icon name={'remove'}/>
				<span>{t.issue}</span>
			</Message>
		}) || null

		// List of reasons
		const reasonElements = tuples && tuples.length && <div className={styles.description}>
			<List bulleted relaxed>
				{ tuples.map(t => {
					return <List.Item key={tuples.indexOf(t)}>{t.reason}</List.Item>
				})
				}
			</List>
		</div> || null

		// Builds the full panel
		return {
			key: pp.timestamp,
			title: {
				content: <>
					<Icon name={titleIconName} className={titleIconClass}/> {this._createTimelineButton(timestamp)}
					{titleElement}
				</>,
			},
			content: {
				content: <>
					{issueElements}
					{reasonElements}
					<Message info>
						<List>
							<List.Content>
								<List.Item>
									<Icon name={'hourglass'}/>
									{timeLeftElement}
								</List.Item>
								<List.Item>
									<Icon name={'arrow down'}/>
									{potencyLostElement}
								</List.Item>
							</List.Content>
						</List>
					</Message>
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

	_isAMissedPP(lastPPInWM, missedPPGracePeriod) {
		return lastPPInWM.timeLeftOnSong > missedPPGracePeriod && !this.downtime.getDowntime(lastPPInWM.timestamp, lastPPInWM.timestamp + missedPPGracePeriod)
	}

	_cleanUpPPs() {
		let lastPP = this._ppEvents[0]

		let badCastInCurrentWM = false
		let stacksUsedInCurrentWM = 0
		const stacksUsedInWM = []
		const castsInWM = []
		let castsInCurrentWM = []

		// It's the length of two dot ticks to have a better chance of being right.
		const missedPPGracePeriod = DOT_TICK_FREQUENCY * 2

		// They didn't use their PP
		if (!this._ppEvents.length) {
			return
		}

		// TODO: Add in checking for EA use after last PP cast for better accuracy
		for (const pp of this._ppEvents) {
			//This means a new Wanderers Minuet was cast since the last one
			if (pp.timeLeftOnSong > lastPP.timeLeftOnSong) {
				if (this._isAMissedPP(lastPP, missedPPGracePeriod)) {
					this._ppEvents.splice(this._ppEvents.indexOf(pp), 0, {
						...lastPP,
						issue: PP_NOT_CAST_AT_END,
					})
					this._lostPotencyFromMissedCast[0] += PP_POTENCY[0]
					this._lostPotencyFromMissedCast[1] += PP_MAX_POTENCY
				}
				// If they don't have a bad cast in this WM window, then we don't care about it
				// Also, Prevents including a pp cast because of downtime improperly.
				if (badCastInCurrentWM) {
					stacksUsedInWM.push(stacksUsedInCurrentWM)
					castsInWM.push(castsInCurrentWM)
					badCastInCurrentWM = false
				}
				stacksUsedInCurrentWM = 0
				castsInCurrentWM = []
			}
			if (this.downtime.isDowntime(pp.lastTickOnEnemy + DOT_TICK_FREQUENCY + ANIMATION_LOCK)) {
				this._ppEvents.splice(this._ppEvents.indexOf(pp), 1)
			}

			if (pp.issue === PP_CAST_WIHTOUT_MAX_STACKS) {
				badCastInCurrentWM = true
			}

			stacksUsedInCurrentWM += pp.stacks
			castsInCurrentWM.push(pp)
			lastPP = pp
		}
		if (badCastInCurrentWM) {
			stacksUsedInWM.push(stacksUsedInCurrentWM)
			castsInWM.push(castsInCurrentWM)
		}

		//To catch if the missed PP was after the last use of PP in the log
		if (this._isAMissedPP(lastPP, missedPPGracePeriod)) {
			this._ppEvents.push({
				...lastPP,
				issue: PP_NOT_CAST_AT_END,
			})
			this._lostPotencyFromMissedCast[0] += PP_POTENCY[0]
			this._lostPotencyFromMissedCast[1] += PP_MAX_POTENCY
		}

		//To properly find how much potency was lost due to missed stacks
		for (const wmIndex in stacksUsedInWM) {
			const casts = castsInWM[wmIndex]
			let totalPotencyInWM = 0
			for (const cast of casts) {
				totalPotencyInWM += PP_POTENCY[cast.stacks - 1]
			}
			const totalStacks = stacksUsedInWM[wmIndex]
			const potencyFromMax = Math.floor(totalStacks / PP[3]) * PP_MAX_POTENCY
			let potencyFromLast = 0
			//Sometimes, you don't get enough stacks for a full pitch perfect, so we include that possiblity in here as well
			if	(totalStacks % PP[3]) {
				potencyFromLast = PP_POTENCY[totalStacks % PP[3] - 1]
			}
			const maxPotencyInWM =  potencyFromMax + potencyFromLast
			this._lostPotencyFromStacks += maxPotencyInWM - totalPotencyInWM
		}
	}

	// Allows for proper localization of potency numbers, aka proper thousands separators and things like that.
	_formatPotency(potency) {
		return potency.toLocaleString()
	}

	_createTimelineButton(timestamp) {
		return <Button
			circular
			compact
			icon="time"
			size="small"
			onClick={() => this.timeline.show(timestamp - this.parser.fight.start_time, timestamp - this.parser.fight.start_time)}
			content={this.parser.formatTimestamp(timestamp)}
		/>
	}

}
