import {t} from '@lingui/macro'
import {Action} from 'data/ACTIONS'
import {JOBS} from 'data/JOBS'
import {Status} from 'data/STATUSES'
import {Event, Events, SourceModifier} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {InitEvent} from 'parser/core/Parser'
import {ARCANA_STATUSES} from '../ArcanaGroups'
import {DOT_ACTIONS, GROUND_DOTS, SPECIAL_STATUS, DOTS_ALIAS} from './ArcanaDoTsGroup'
import {CritAndDHPredictor, CRIT_DH_TYPES} from './CritAndDHRates'
import {optimalRoleVerify} from './OptimalRoleVerify'

/*
Preliminary notes:

A few assumptions went into the preparation of this section including:
	- cards played at that time could have been played on another target including the optimal target. This assumption was necessary since we don't have location data to tell whether the target was targetable at that time. Additionally, this removes speculation of optimizing card plays which would make this tool a predictive one instead of an informative one.
	- critical hits and direct hit relative percentages have been utilized to normalize damage figures based on the CritAndDH module and the normalizer helper below
	- All combatants in the log are combatants who can receive cards (i.e. not alliance raid members, are targetable, etc.). Note: this assumption allows for chocobos to be included as long as there are less than 8 players included. However, no move sets by chocobos have been included and no testing has been done over chocobos, but I am not relaying this information to the user since chocobos are not included in logs typically anyway.

Other noteworthy items:

	- if you want to compare damage to FFLogs, you need to compare non-tick damage AND damage prepared within window. no other damage included.
		filter expression in FFLogs is IN RANGE FROM timestamp=9000 to timestamp=23980 END where the timestamps MUST relate to an actual event. if the event doesn't exist, the filter won't work
		please note that if a preparation event happens on the cusp of this, it'll be included in damage
	- damage will be normalized based on relative critical hit and direct hit rates based on the initial calculations done in CritAndDHRates. All of the special cases in CritAndDHRatesConsts need to be considered and applied below since they have varying impacts on the expected value calculations.
		- considerations: regular modifiers are built into the function .getCritDH and .getCritMulti, so these considerations are
							inert modifier is taken as base damage with no expected damage formula application
							auto crits/dh are taken base damage and multiplier without any percentage application. this consideration is also applied for moves that only crit for specific moves or weaponskills
							Note: there is an assumption for autocrits that the crit multiplier is the same multiplier as a regular crit including all aforeapplied non-autocrit modifiers as part of .getCritMulti
*/

const OPTIMAL_CARD_PERCENTAGE = 0.06
const NOT_OPTIMAL_CARD_PERCENTAGE = 0.03
const MAX_PLAYERS = 8 //won't be processed for alliance raids, hunt groups, etc.
const DHIT_MOD = 0.25

export interface PartyState {
	//target info
	lastEvent: InitEvent | Events['statusApply'] | Events['statusRemove']
	card: Status['id']
	actualTarget: Actor['id']
	targetPercentage: number

	//party info
	partyDamage: { [id: Actor['id']]: number}
	partyMembersWithCards?: { [id: Actor['id']]: {percentage: number, card: Status['id']}} //used to track party members who have cards already in the window and at what percentage
}

// interface is used to normalize DoT damage similar to actual damage as noted above.
export interface DoTs{
	timestamp: number
	actor: Actor['id']
	status: Status['id']
	damage: number //tracks actor who used dot or ground action during window (indexed by timestamp of arcana card window)
	percentage: number //tracks percentage buff from card if one is applied
	crit: number //crit at time of application
	DH: number //DH at time of application
	critMultiplier: number //crit multiplier at time of application
}

// hooks are used here to allow for quick adding and removal as necessary. A dictionary was used to ensure uniqueness and reduce duplication of hooks
interface damageHook {
	[actor: Actor['id']]:{[damageSource: Action['id'] | Status['id']]: {hook: EventHook<Events['damage']>}}
}

interface statusRemoveHook {
	[actor: Actor['id']]: {[status: Status['id']]: {hook: EventHook<Events['statusRemove']>}}
}

export default class ArcanaTrackingOptimized extends Analyser {
	static override handle = 'arcanaTrackingOptimized'
	static override title = t('ast.arcana-tracking-optimized.title')`Arcana Tracking Optimized`

	@dependency private data!: Data
	@dependency private actors!: Actors
	@dependency private critDH!: CritAndDHPredictor

	private partyStateLog: PartyState[] = []
	private partyWindow: PartyState[] = []
	private playerControlled: Array<Actor['id']> = []
	private damageHook: Array<EventHook<Events['damage']>> | undefined = undefined

	//card stuff
	private arcanaStatuses: Array<Status['id']> = []

	//pets
	private damageHookPet: Array<EventHook<Events['damage']>> | undefined = undefined
	private pets: Array<Actor['id']> = []

	//dots
	private dotsStatus: Array<Status['id']> = []
	private groundDotsStatus: Array<Status['id']> = []
	private dotsInWindow: DoTs[] = [] //this one is used temporarily for damage tracking
	private dotsComplete: DoTs[] = [] //this one is used on complete to add damage
	private dotWindowOpen: boolean = false

	//dot hooks
	private dotDamageHook: damageHook = {}
	private dotStatusRemoveHook: statusRemoveHook = {}

	//see ArcanaDoTsGroup for explanation of these cases
	private specialStatus: Array<Status['id']> = []
	//I put two because I want to be able to index one and the other on a whim
	private statusAlias: {[status: Status['id']]: {alias: Status['id']}} = {}
	private aliasStatus: {[alias: Status['id']]: {status: Status['id']}} = {}

	override initialise() {
		// Initialize grouped reference to actions/statuses data
		this.arcanaStatuses = ARCANA_STATUSES.map(statusKey => this.data.statuses[statusKey].id)
		this.specialStatus = SPECIAL_STATUS.map(statusKey => this.data.statuses[statusKey].id)
		DOTS_ALIAS.forEach(dot => this.statusAlias[this.data.statuses[dot[0]].id] = {alias: this.data.statuses[dot[1]].id})
		DOTS_ALIAS.forEach(dot => this.aliasStatus[this.data.statuses[dot[1]].id] = {status: this.data.statuses[dot[0]].id})
		this.dotsStatus = DOT_ACTIONS
			.filter(actionKey => this.data.actions[actionKey] !== undefined && this.data.actions[actionKey].statusesApplied !== undefined)
			.flatMap(actionKey =>
				//ts is complaining about the potential for undefined, but the filter already filters these out, so ¯\_(ツ)_/¯
				this.data.actions[actionKey].statusesApplied.map(statusKey => {
					return this.data.statuses[statusKey].id
				})
			)
		this.groundDotsStatus = GROUND_DOTS
			.filter(actionKey => this.data.actions[actionKey] !== undefined && this.data.actions[actionKey].statusesApplied !== undefined)
			.flatMap(actionKey =>
				//ts is complaining about the potential for undefined, but the filter already filters these out, so ¯\_(ツ)_/¯
				this.data.actions[actionKey].statusesApplied.map(statusKey => {
					return this.data.statuses[statusKey].id
				})
			)

		//technically player specific items
		this.playerControlled = this.parser.pull.actors.filter(actor => actor.playerControlled).map(actors => actors.id)
		this.pets = this.parser.pull.actors.filter(actor => actor.owner != null).map(actors => actors.id)
		const playerFilter = filter<Event>().status(oneOf(this.arcanaStatuses)).source(this.parser.actor.id)

		//an exit if there are more than the max players used in the analysis
		if (this.playerControlled.length > MAX_PLAYERS) { return }

		this.addEventHook(
			playerFilter
				.type('statusApply')
				.target(oneOf(this.playerControlled)),
			this.onCardApply
		)
		this.addEventHook(
			playerFilter
				.type('statusRemove')
				.target(oneOf(this.playerControlled)),
			this.onCardRemove
		)
		//note: special statuses and ground dots are not included in this intentionally since these types of statuses do not snapshot for the entire duration, only when damage is applied.
		this.addEventHook(
			filter<Event>()
				.type('statusApply')
				.source(oneOf(this.playerControlled))
				.status(oneOf(this.dotsStatus)),
			this.onDotApply)

		this.addEventHook('complete', this.onComplete)
	}

	public get partyLogs() {
		return this.partyStateLog
	}

	/**
	 * Adds the Arcana Buff to target party member
	 */
	private onCardApply(event: Events['statusApply']) {
		this.dotWindowOpen = true

		//add hooks if hooks don't already exist
		if (this.damageHook === undefined) {
			this.damageHook = this.playerControlled.map(actor =>
				this.addEventHook(
					filter<Event>()
						.source(actor)
						.type('damage'),
					this.onCast)
			)
		}
		if (this.damageHookPet === undefined) {
			this.damageHookPet = this.pets.map(actor =>
				this.addEventHook(
					filter<Event>()
						.source(actor)
						.type('damage'),
					this.onCast)
			)
		}

		//set up percentage based on role
		const targetJob = this.actors.get(event.target).job
		const optimalRole = optimalRoleVerify(JOBS[targetJob].role, event.status)
		const targetPercentage = optimalRole === undefined ? 0 :
			optimalRole ? OPTIMAL_CARD_PERCENTAGE : NOT_OPTIMAL_CARD_PERCENTAGE

		//to add party members with cards already
		const partyWithCards: { [id: Actor['id']]: {percentage: number, card: Status['id']}} = {}
		if (this.partyWindow.length !== 0) {
			this.partyWindow.forEach(window =>
				partyWithCards[window.actualTarget] = {
					percentage: window.targetPercentage,
					card: window.card,
				}
			)
		}

		//push set up for current window
		const lineSetUp: PartyState = {
			lastEvent: event,
			card: event.status,
			partyDamage: {},
			actualTarget: this.actors.get(event.target).id,
			targetPercentage: targetPercentage,
			partyMembersWithCards: partyWithCards,
		}
		this.partyWindow.push(lineSetUp)
	}

	/**
	 * Once buff expires, pushes list to party log
	 */
	private onCardRemove(event: Events['statusRemove']) {
		if (this.partyWindow.length === 0) { return }

		//used to create list of party members as opposed to dictionary
		this.partyWindow.filter(window => window.actualTarget === event.target).forEach(removedWindow => this.partyLogs.push(removedWindow))
		if (this.partyWindow.filter(window => window.actualTarget !== event.target).length === 0) {
			this.partyWindow = []
		} else {
			this.partyWindow = this.partyWindow.filter(window => window.actualTarget !== event.target)
		}

		//remove hooks only if no more party windows
		if (this.partyWindow.length !== 0) { return }
		if (this.damageHook != null) {
			this.damageHook.forEach(hook =>
				this.removeEventHook(hook)
			)
			this.damageHook = undefined
		}
		if (this.damageHookPet != null) {
			this.damageHookPet.forEach(hook =>
				this.removeEventHook(hook)
			)
			this.damageHookPet = undefined
		}
		this.dotWindowOpen = false
	}

	/**
	 * Updates damage amount for non-dots
	 */
	private onCast(event: Events['damage']) {
		//dots will be handled in another function as only dots applied IN the window should be considered. additionally statuses that act like actions will be handled like actions EXCEPT ground dots which will be handled in the same manner as actions largely because these "dots" do not snapshot
		if (event.cause.type === 'status' && !this.specialStatus.includes(event.cause.status) && !this.groundDotsStatus.includes(event.cause.status)) { return }
		const owner: Actor['id'] | undefined = this.actors.get(event.source)?.owner?.id

		let damage: number = 0
		event.targets.forEach(target => {
			const critDHEvent = owner != null ? this.critDH.getCritDH(event.timestamp, owner) : this.critDH.getCritDH(event.timestamp, event.source)
			const critMultiplier = owner != null ? this.critDH.getCritMulti(event.timestamp, owner) : this.critDH.getCritMulti(event.timestamp, event.source)
			damage += this.expectedDamageAdjustment(critDHEvent.critType, critDHEvent.DHType, critDHEvent.crit, critDHEvent.DH, target.amount, critMultiplier, target.sourceModifier)
		})

		//find percentage buff on current target to take out of damage later on. should be unique so the sum should return the right value
		let cardPercentageBuff: number = 0
		this.partyWindow.filter(cardWindow => cardWindow.actualTarget === event.source).forEach(cardwindow => { cardPercentageBuff += cardwindow.targetPercentage })
		//owner set up for pet damage
		if (owner != null) {
			this.partyWindow.forEach(window => {
				if (window.partyDamage[owner] === undefined) {
					window.partyDamage[owner] = 0
				}
				window.partyDamage[owner] += damage / (1 + cardPercentageBuff)
			})
		} else {
			this.partyWindow.forEach(window => {
				if (window.partyDamage[event.source] === undefined) {
					window.partyDamage[event.source] = 0
				}
				window.partyDamage[event.source] += damage / (1 + cardPercentageBuff)
			})
		}
	}

	/**
	 * Opens up window for dots that snapshot during card window
	 */
	private onDotApply(event: Events['statusApply']) {
		//ignore applications of statuses we are aliasing
		if (this.statusAlias[event.status] !== undefined) { return }

		//refresh handle
		const dotsRefresh = this.dotsInWindow.filter(dot => dot.status === event.status && dot.actor === event.source)
		//splice a removal event
		if (dotsRefresh.length !== 0) {
			const eventRemove: Events['statusRemove'] = {
				type: 'statusRemove',
				status: event.status,
				source: event.source,
				target: event.target,
				timestamp: event.timestamp,
			}
			this.onDotRemove(eventRemove)
		}

		if (!this.dotWindowOpen) { return }

		//set up damage hooks only if the window is open
		if (this.dotDamageHook[event.source] === undefined) { this.dotDamageHook[event.source] = {} }
		if (this.dotDamageHook[event.source][event.status] === undefined) {
			this.dotDamageHook[event.source][event.status] = {
				hook: this.addEventHook(
					filter<Event>()
						.type('damage')
						.source(event.source)
						.cause({type: 'status', status: event.status}),
					this.onDotDamage),
			}
		}

		//set up dot removal hooks. i.e. only add hooks when necessary
		if (this.dotStatusRemoveHook[event.source] === undefined) { this.dotStatusRemoveHook[event.source] = {} }
		if (this.dotStatusRemoveHook[event.source][event.status] === undefined) {
			this.dotStatusRemoveHook[event.source][event.status] = {
				hook: this.addEventHook(
					filter<Event>()
						.type('statusRemove')
						.source(event.source)
						.status(event.status),
					this.onDotRemove),
			}
		}

		//find percentage buff on current target to take out of damage later on
		let cardPercentageBuff = 0
		this.partyWindow.filter(cardWindow => cardWindow.actualTarget === event.source).forEach(cardwindow => { cardPercentageBuff += cardwindow.targetPercentage })

		//push dot window for each open window
		this.partyWindow.forEach(window => {
			const dot: DoTs = {
				timestamp: window.lastEvent.timestamp,
				actor: event.source,
				status: event.status,
				damage: 0,
				percentage: cardPercentageBuff,
				crit: this.critDH.getCritDH(event.timestamp, event.source).crit,
				DH: this.critDH.getCritDH(event.timestamp, event.source).DH,
				critMultiplier: this.critDH.getCritMulti(event.timestamp, event.source),
			}
			this.dotsInWindow.push(dot)
		})

		//statusAlias consideration (i.e. statuses that are not associated with the original status. A good example is MCH wildfire on the target which refreshes a bunch so it's easier to track the wildfire status on the MCH)
		if (this.aliasStatus[event.status] === undefined) { return }
		const aliasStatusID = this.aliasStatus[event.status].status
		if (this.dotDamageHook[event.source] === undefined) { this.dotDamageHook[event.source] = {} }
		if (this.dotDamageHook[event.source][aliasStatusID] === undefined) {
			this.dotDamageHook[event.source][aliasStatusID] = {
				hook: this.addEventHook(
					filter<Event>()
						.type('damage')
						.source(event.source)
						.cause({type: 'status', status: aliasStatusID}),
					this.onDotDamage),
			}
		}

		//push dot window for each open window for the aliased status
		this.partyWindow.forEach(window => {
			const dot: DoTs = {
				timestamp: window.lastEvent.timestamp,
				actor: event.source,
				status: aliasStatusID,
				damage: 0,
				percentage: cardPercentageBuff,
				crit: this.critDH.getCritDH(event.timestamp, event.source).crit,
				DH: this.critDH.getCritDH(event.timestamp, event.source).DH,
				critMultiplier: this.critDH.getCritMulti(event.timestamp, event.source),
			}
			this.dotsInWindow.push(dot)
		})
	}

	/**
	 * Closes dot window on expiry only if the dot was applied during an open card window
	 */
	private onDotRemove(event: Events['statusRemove']) {
		//remove statusRemove hooks
		this.removeEventHook(this.dotStatusRemoveHook[event.source][event.status].hook)
		delete this.dotStatusRemoveHook[event.source][event.status]

		this.removeEventHook(this.dotDamageHook[event.source][event.status].hook)
		delete this.dotDamageHook[event.source][event.status]

		//dots to be pushed to be counted towards damage
		const dotsToPush = this.dotsInWindow.filter(dot => dot.actor === event.source && dot.status === event.status)
		this.dotsInWindow = this.dotsInWindow.filter(dot => !(dot.actor === event.source && dot.status === event.status))

		dotsToPush.forEach(dot => this.dotsComplete.push(dot))

		//consideration for aliasStatus
		if (this.aliasStatus[event.status] === undefined) { return }
		const aliasStatusID = this.aliasStatus[event.status].status

		this.removeEventHook(this.dotDamageHook[event.source][aliasStatusID].hook)
		delete this.dotDamageHook[event.source][aliasStatusID]

		const dotsToPushAliasStatus = this.dotsInWindow.filter(dot => dot.actor === event.source && dot.status === aliasStatusID)
		this.dotsInWindow = this.dotsInWindow.filter(dot => !(dot.actor === event.source && dot.status === aliasStatusID))

		dotsToPushAliasStatus.forEach(dot => this.dotsComplete.push(dot))
	}

	/**
	 * Dot damage consideration only for dots that open during a card window
	 */
	private onDotDamage(event: Events['damage']) {
		//ts complains without this statement even though our hooks are only with cause type status
		if (event.cause.type === 'action') { return }
		const status = event.cause.status

		let damage = 0

		this.dotsInWindow.filter(dotWindow => dotWindow.actor === event.source && dotWindow.status === status).forEach(window => {
			//damage is brought into this loop because I need the specific dot crit/DH and the source modifier for each target to normalize
			damage = 0
			event.targets.forEach(target => {
				//assumption: no autocrit or inert DoTs
				damage += this.expectedDamageAdjustment(CRIT_DH_TYPES.normal, CRIT_DH_TYPES.normal, window.crit, window.DH, target.amount, window.critMultiplier, target.sourceModifier)
			})
			window.damage += damage / (1 + window.percentage)
		})
	}

	/*
	* to output the expected damage based on known types within the specified damage event. it has many inputs, but this method is used to consolidate a bit of case management for ease of review.
	*/
	private expectedDamageAdjustment(critType: string, DHType: string, crit: number, DH: number, baseDamage: number, critMultiplier: number, sourceModifier: number): number {
		//since multiplication is associative, we won't care about the order of multiplication. for simplicity, we will react first with crit, dh, then deal with source modifiers
		//inert
		if (critType === CRIT_DH_TYPES.inert && DHType === CRIT_DH_TYPES.inert) { return baseDamage }

		let adjustedDamage = baseDamage

		//crit management
		if (critType === CRIT_DH_TYPES.auto) { adjustedDamage = adjustedDamage * (1 + critMultiplier) }
		if (critType === CRIT_DH_TYPES.normal) { adjustedDamage = adjustedDamage * (1 + crit * critMultiplier) }

		//DH management
		if (DHType === CRIT_DH_TYPES.auto) { adjustedDamage = adjustedDamage * (1 + DHIT_MOD) }
		if (DHType === CRIT_DH_TYPES.normal) { adjustedDamage = adjustedDamage * (1 + DH * DHIT_MOD) }

		//source modifier management
		if (sourceModifier === SourceModifier.CRITICAL || sourceModifier === SourceModifier.CRITICAL_DIRECT) { adjustedDamage = adjustedDamage / (1 + critMultiplier) }
		if (sourceModifier === SourceModifier.DIRECT || sourceModifier === SourceModifier.CRITICAL_DIRECT) { adjustedDamage = adjustedDamage / (1 + DHIT_MOD) }

		return adjustedDamage
	}

	private onComplete() {
		//in case dots weren't removed
		this.dotsInWindow.forEach(dot => this.dotsComplete.push(dot))

		//to add dots to each respective damage windows.
		this.dotsComplete.filter(dot => dot.damage !== 0).forEach(dot => {
			this.partyLogs
				.filter(logs => logs.lastEvent.timestamp === dot.timestamp)
				.forEach(log => {
					if (log.partyDamage[dot.actor] === undefined) { log.partyDamage[dot.actor] = 0 }
					log.partyDamage[dot.actor] += dot.damage
				})
		})
	}
}
