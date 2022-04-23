import {Action, ActionRoot} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events, SourceModifier} from 'event'
import math from 'mathjsCustom'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import {AUTO_CRIT_ABILITIES, AUTO_DH_ABILITIES, CRIT_ENEMY_MODIFIERS, CRIT_PARTY_MODIFIERS, DH_PARTY_MODIFIERS, GCD_CRIT_MODIFIER, GCD_DH_MODIFIER, INERT_CRIT_DH, SPECIFIC_ACTION_MODIFIER} from './CritAndDHRatesConsts'

const BASE_CRIT_PROBABILITY = 0.05 //5%
const BASE_CRIT_MULTIPLIER = 0.4
const ROUNDING_FACTOR = 0.001 //to match rounding used in game for crit rates

export const CRIT_DH_TYPES: {inert: string, auto: string, normal: string} = {
	inert: 'inert',
	auto: 'auto',
	normal: 'normal',
}

const AUTO_CRIT_ABILITIES_FROM_PATCH_6_1: Array<keyof ActionRoot> = [
	'MIDARE_SETSUGEKKA',
	'KAESHI_SETSUGEKKA',
	'OGI_NAMIKIRI',
	'KAESHI_NAMIKIRI',
]

export class CritAndDHPredictor extends Analyser {
	static override handle = 'critAndDHQuery'

	@dependency private data!: Data
	@dependency private actors!: Actors

	private playerControlled: Array<Actor['id']> = []
	private pets: Array<Actor['id']> = []

	//variable for output
	private estCritDH: {[actor: Actor['id']]: {crit: number, DH: number}} = {}

	//to initialize
	private completeInitialized: boolean = false

	//format for damage event
	private damageEvent: Array<{actor: Actor['id'], timestamp: number, action: Status['id'] | Action['id'], critMod: number, DHMod: number, sourceModifier: number, critType: string, DHType: string}> = []
	private statusEvent: Array<{actor: Actor['id'], timestamp: number, action: Status['id'] | Action['id'], critRate: number, DHRate: number}> = []
	private critPartyModifierCurrent: {[actor: Actor['id']]: {currentModifier: number}} = {}
	private critEnemyModifierCurrent: {[actor: Actor['id']]: {currentModifier: number}} = {}
	private DHPartyModifierCurrent: {[actor: Actor['id']]: {currentModifier: number}} = {}
	private appliedStatuses: Array<{actor: Actor['id'], status: Status['id']}> = [] //reasoning is that bard's statuses are reapplied without removal. this is to catch those

	//crit and DH Modifier variables
	private critPartyModifiers: {[id: Status['id']]: {strength: number}} = {}
	private critEnemyModifiers: {[id: Status['id']]: {strength: number}} = {}
	private DHPartyModifiers: {[id: Status['id']]: {strength: number}} = {}

	//to store the above crits, dh in an easy to call variable for hooks
	private critPartyStatuses: Array<Status['id']> = []
	private critEnemyStatuses: Array<Status['id']> = []
	private DHPartyStatuses: Array<Status['id']> = []

	//these are abilities that will automatically crit or direct hit which will skew results and should automatically be removed from the respective DH or Crit calculations
	private autoCritAbilities: Array<Action['id']> = []
	private autoDHAbilities: Array<Action['id']> = []

	//abilities that cannot crit or DH
	private inertAbilities: Array<Action['id']> = []

	//abilities that only crit/DH for the very next GCD
	private gcdCritModifier: Array<Status['id']> = []
	private gcdDHModifier: Array<Status['id']> = []

	//status that only crit/dh for specific abilities
	private specialCritDHAbilities: Array<{status: Status['id'], action: Action['id'], critModifier: number, DHModifier: number}> = []
	private specialCritDHStatuses: Array<Status['id']> = []

	override initialise() {
		//initial set up of crit/dh variables based on items in CritAndDHRatesConsts
		CRIT_PARTY_MODIFIERS.forEach(modifier => this.critPartyModifiers[this.data.statuses[modifier.status].id] = {strength: modifier.strength})
		CRIT_ENEMY_MODIFIERS.forEach(modifier => this.critEnemyModifiers[this.data.statuses[modifier.status].id] = {strength: modifier.strength})
		DH_PARTY_MODIFIERS.forEach(modifier => this.DHPartyModifiers[this.data.statuses[modifier.status].id] = {strength: modifier.strength})
		this.critPartyStatuses = CRIT_PARTY_MODIFIERS.map(modifier => this.data.statuses[modifier.status].id)
		this.critEnemyStatuses = CRIT_ENEMY_MODIFIERS.map(modifier => this.data.statuses[modifier.status].id)
		this.DHPartyStatuses = DH_PARTY_MODIFIERS.map(modifier => this.data.statuses[modifier.status].id)
		this.autoCritAbilities = AUTO_CRIT_ABILITIES.map(ability => this.data.actions[ability].id)
		this.autoDHAbilities = AUTO_DH_ABILITIES.map(ability => this.data.actions[ability].id)
		this.inertAbilities = INERT_CRIT_DH.map(ability => this.data.actions[ability].id)
		this.gcdCritModifier = GCD_CRIT_MODIFIER.map(status => this.data.statuses[status].id)
		this.gcdDHModifier = GCD_DH_MODIFIER.map(status => this.data.statuses[status].id)
		this.specialCritDHStatuses = SPECIFIC_ACTION_MODIFIER.map(specificAction => this.data.statuses[specificAction.status].id)
		SPECIFIC_ACTION_MODIFIER.forEach(specificAction => this.specialCritDHAbilities.push(
			{status: this.data.statuses[specificAction.status].id,
				action: this.data.actions[specificAction.action].id,
				critModifier: specificAction.critModifier,
				DHModifier: specificAction.DHModifier}
		))

		//to add special statuses to crit party and dh party since they will be utilized in the related functions below, but treated differently on execution
		this.critPartyStatuses.concat(this.gcdCritModifier)
		this.DHPartyStatuses.concat(this.gcdDHModifier)
		//note since we are giving this similar treatment as gcds above, we only need to track the status application once, not twice so only crit application was utilized for this purpose
		this.critPartyStatuses.concat(this.specialCritDHStatuses)

		//6.1 additions
		if (this.parser.patch.after('6.08')) {
			this.autoCritAbilities.concat(AUTO_CRIT_ABILITIES_FROM_PATCH_6_1.map(actionKey => this.data.actions[actionKey].id))
		}

		this.playerControlled = this.parser.pull.actors.filter(actor => actor.playerControlled).map(actors => actors.id)
		this.pets = this.parser.pull.actors.filter(actor => actor.owner != null).map(actors => actors.id)
		//initial set up of player modifiers
		this.playerControlled.forEach(player => {
			this.critPartyModifierCurrent[player] = {
				currentModifier: 0,
			}
			this.DHPartyModifierCurrent[player] = {
				currentModifier: 0,
			}
		})

		//get damage events to parse out crit and DH
		this.addEventHook(
			filter<Event>()
				.source(oneOf(this.playerControlled))
				.type('damage'),
			this.damage
		)
		this.addEventHook(
			filter<Event>()
				.source(oneOf(this.pets))
				.type('damage'),
			this.petDamage
		)

		//statuses
		this.addEventHook(
			filter<Event>()
				.target(oneOf(this.playerControlled))
				.type('statusApply')
				.status(oneOf(this.critPartyStatuses)),
			this.critPartyApply
		)
		this.addEventHook(
			filter<Event>()
				.target(oneOf(this.playerControlled))
				.type('statusRemove')
				.status(oneOf(this.critPartyStatuses)),
			this.critPartyRemove
		)

		this.addEventHook(
			filter<Event>()
				.target(oneOf(this.playerControlled))
				.type('statusApply')
				.status(oneOf(this.DHPartyStatuses)),
			this.DHPartyApply
		)
		this.addEventHook(
			filter<Event>()
				.target(oneOf(this.playerControlled))
				.type('statusRemove')
				.status(oneOf(this.DHPartyStatuses)),
			this.DHPartyRemove
		)

		//note no target since assumed only enemies receive these statuses
		this.addEventHook(
			filter<Event>()
				.type('statusApply')
				.status(oneOf(this.critEnemyStatuses)),
			this.critEnemyApply
		)
		this.addEventHook(
			filter<Event>()
				.type('statusRemove')
				.status(oneOf(this.critEnemyStatuses)),
			this.critEnemyRemove
		)

		//complete
		this.addEventHook('complete', this.onComplete)
	}

	private damage(event: Events['damage']) {
		//statuses are given
		if (event.cause.type === 'status'
				&& (event.directHitRate !== 0 && event.directHitRate != null
				|| event.expectedCritRate !== 0 && event.expectedCritRate != null)) {
			this.statusEvent.push({
				actor: event.source,
				timestamp: event.timestamp,
				action: event.cause.status,
				critRate: (event.expectedCritRate ?? 0) * ROUNDING_FACTOR, //crit rate is stated in 0.1
				DHRate: event.directHitRate ?? 0,
			})
			return
		}

		if (event.targets.length === 0) { return }
		const action = event.cause.type === 'action' ? event.cause.action : event.cause.status
		//crit modifier applications for special cases
		const specialAbility = this.specialCritDHAbilities.find(ability => event.cause.type === 'action' && ability.action === event.cause.action) !== undefined ? this.specialCritDHAbilities.find(ability => event.cause.type === 'action' && ability.action === event.cause.action) : undefined
		//if there is an ability found, but the modifier for the specific moveset is not 100%, then it'll add a crit modifier
		const specialAbilityCritModifier = this.appliedStatuses.filter(appliedStatus => appliedStatus.actor === event.source && this.specialCritDHStatuses.includes(appliedStatus.status)).length >= 1 && specialAbility !== undefined && specialAbility.critModifier < 1
			? specialAbility.critModifier : 0
		const specialAbilityDHModifier = this.appliedStatuses.filter(appliedStatus => appliedStatus.actor === event.source && this.specialCritDHStatuses.includes(appliedStatus.status)).length >= 1 && specialAbility !== undefined && specialAbility.DHModifier < 1
			? specialAbility.DHModifier : 0
		//checks for auto crits, auto crits for GCD, special abilities that auto crit. if so applies specific crit type, otherwise checks if inert
		const critType = this.autoCritAbilities.includes(action)
			|| this.appliedStatuses.filter(appliedStatus => appliedStatus.actor === event.source && this.gcdCritModifier.includes(appliedStatus.status)).length >= 1 && event.cause.type === 'action' && this.data.getAction(event.cause.action)?.onGcd
			|| specialAbility !== undefined && specialAbility.critModifier >= 1
			? CRIT_DH_TYPES.auto : this.inertAbilities.includes(action) ? CRIT_DH_TYPES.inert : CRIT_DH_TYPES.normal
		//checks for auto DH, auto DH for GCD, special abilities that auto DH. if so applies specific DH type, otherwise checks if inert
		const DHType = this.autoDHAbilities.includes(action)
			|| this.appliedStatuses.filter(appliedStatus => appliedStatus.actor === event.source && this.gcdDHModifier.includes(appliedStatus.status)).length >= 1 && event.cause.type === 'action' && this.data.getAction(event.cause.action)?.onGcd
			|| specialAbility !== undefined && specialAbility.DHModifier >= 1
			? CRIT_DH_TYPES.auto : this.inertAbilities.includes(action) ? CRIT_DH_TYPES.inert : CRIT_DH_TYPES.normal
		//damage handling
		event.targets.forEach(target => {
			//verify it is initialized
			if (this.critEnemyModifierCurrent[target.target] === undefined) {
				this.critEnemyModifierCurrent[target.target] = {
					currentModifier: 0,
				}
			}
			this.damageEvent.push(
				{
					actor: event.source,
					timestamp: event.timestamp,
					action: action,
					critMod: this.critPartyModifierCurrent[event.source].currentModifier + this.critEnemyModifierCurrent[target.target].currentModifier + specialAbilityCritModifier,
					DHMod: this.DHPartyModifierCurrent[event.source].currentModifier + specialAbilityDHModifier,
					sourceModifier: target.sourceModifier,
					critType: critType,
					DHType: DHType,
				}
			)
		})
	}

	private petDamage(event: Events['damage']) {
		const owner: Actor['id'] | undefined = this.actors.get(event.source)?.owner?.id
		if (event.targets.length === 0 || owner === undefined) { return }
		//statuses are given. Assumption is that pet assumes same bonuses as owner
		if (event.cause.type === 'status'
				&& (event.directHitRate !== 0 && event.directHitRate != null
				|| event.expectedCritRate !== 0 && event.expectedCritRate != null)) {
			this.statusEvent.push({
				actor: owner,
				timestamp: event.timestamp,
				action: event.cause.status,
				critRate: (event.expectedCritRate ?? 0) * ROUNDING_FACTOR, //crit rate is stated in 0.1
				DHRate: event.directHitRate ?? 0,
			})
			return
		}
		const action = event.cause.type === 'action' ? event.cause.action : event.cause.status
		//note: assumes DH/crit are inherited directly from owner
		event.targets.forEach(target => {
			//verify it is initialized
			if (this.critEnemyModifierCurrent[target.target] === undefined) {
				this.critEnemyModifierCurrent[target.target] = {
					currentModifier: 0,
				}
			}
			this.damageEvent.push(
				{
					actor: owner,
					timestamp: event.timestamp,
					action: action,
					critMod: this.critPartyModifierCurrent[owner].currentModifier + this.critEnemyModifierCurrent[target.target].currentModifier,
					DHMod: this.DHPartyModifierCurrent[owner].currentModifier,
					sourceModifier: target.sourceModifier,
					critType: CRIT_DH_TYPES.normal,
					DHType: CRIT_DH_TYPES.normal,
				}
			)
		}
		)
	}

	private critPartyApply(event: Events['statusApply']) {
		//check if applied already
		if (this.appliedStatuses.filter(applied => applied.actor === event.target && applied.status === event.status).length !== 0) { return }
		this.appliedStatuses.push({actor: event.target, status: event.status})
		//gcds are only considered in damage for their strength and will be handled in damage events. it won't have a straight crit modifier added
		if (this.gcdCritModifier.includes(event.status) || this.specialCritDHStatuses.includes(event.status)) { return }
		//used just in case a bad status gets through
		if (this.critPartyModifiers[event.status] === undefined) { return }
		//adds strength during window
		this.critPartyModifierCurrent[event.target].currentModifier += this.critPartyModifiers[event.status].strength
	}

	private critPartyRemove(event: Events['statusRemove']) {
		this.appliedStatuses = this.appliedStatuses.filter(applied => event.target !== applied.actor && event.status !== applied.status)
		//gcds are only considered in damage for their strength and will be handled in damage events. it won't have a straight crit modifier added
		if (this.gcdCritModifier.includes(event.status)) { return }
		//used just in case a bad status gets through
		if (this.critPartyModifiers[event.status] === undefined) { return }
		this.critPartyModifierCurrent[event.target].currentModifier -= this.critPartyModifiers[event.status].strength
	}

	private critEnemyApply(event: Events['statusApply']) {
		//check if applied already
		if (this.appliedStatuses.filter(applied => applied.actor === event.target && applied.status === event.status).length !== 0) { return }
		//initial set up if enemy is not set up
		if (this.critEnemyModifierCurrent[event.target] === undefined) {
			this.critEnemyModifierCurrent[event.target] = {
				currentModifier: 0,
			}
		}
		//used just in case a bad status gets through
		if (this.critEnemyModifiers[event.status] === undefined) { return }
		this.appliedStatuses.push({actor: event.target, status: event.status})
		//adds strength during window
		this.critEnemyModifierCurrent[event.target].currentModifier += this.critEnemyModifiers[event.status].strength
	}

	private critEnemyRemove(event: Events['statusRemove']) {
		//initial set up if enemy is not set up. shouldn't happen since removed statuses aren't magically applied
		if (this.critEnemyModifierCurrent[event.target] === undefined) {
			this.critEnemyModifierCurrent[event.target] = {
				currentModifier: 0,
			}
		}
		//used just in case a bad status gets through
		if (this.critEnemyModifiers[event.status] === undefined) { return }
		this.appliedStatuses = this.appliedStatuses.filter(applied => event.target !== applied.actor && event.status !== applied.status)
		//adds strength during window
		this.critEnemyModifierCurrent[event.target].currentModifier -= this.critEnemyModifiers[event.status].strength
	}

	private DHPartyApply(event: Events['statusApply']) {
		//check if applied already
		if (this.appliedStatuses.filter(applied => applied.actor === event.target && applied.status === event.status).length !== 0) { return }
		this.appliedStatuses.push({actor: event.target, status: event.status})
		//gcds are only considered in damage for their strength and will be handled in damage events. it won't have a straight DH modifier added
		if (this.gcdDHModifier.includes(event.status)) { return }
		//used just in case a bad status gets through
		if (this.DHPartyModifierCurrent[event.status] === undefined) { return }
		//adds strength during window
		this.DHPartyModifierCurrent[event.target].currentModifier += this.DHPartyModifiers[event.status].strength
	}

	private DHPartyRemove(event: Events['statusRemove']) {
		this.appliedStatuses = this.appliedStatuses.filter(applied => event.target !== applied.actor && event.status !== applied.status)
		//gcds are only considered in damage for their strength and will be handled in damage events. it won't have a straight DH modifier added
		if (this.gcdDHModifier.includes(event.status)) { return }
		//used just in case a bad status gets through
		if (this.DHPartyModifierCurrent[event.status] === undefined) { return }
		//adds strength during window
		this.DHPartyModifierCurrent[event.target].currentModifier -= this.DHPartyModifiers[event.status].strength
	}

	private onComplete() {

		this.playerControlled.forEach(player => {
			let crit: number = 0
			let DH: number = 0
			const statusEvent = this.statusEvent.find(event => event.actor === player)

			//get it from statuses if available
			if (statusEvent !== undefined) {
				crit = statusEvent.critRate
				DH = statusEvent.DHRate
				//push to table
				this.estCritDH[player] = {
					crit: Math.floor(crit / ROUNDING_FACTOR) * ROUNDING_FACTOR,
					DH: Math.floor(DH / ROUNDING_FACTOR) * ROUNDING_FACTOR,
				}
				return
			}

			const damageEventPlayer = this.damageEvent.filter(event => event.actor === player
					&& event.DHType === CRIT_DH_TYPES.normal //remove inert and guaranteed DH. this comes at the expense of crit
					&& event.critType === CRIT_DH_TYPES.normal //remove inert and guaranteed crit. this comes at the expense of DH
					//TO DO: split this up between DH and crit. will likely cause a doubling of some variables.
			)
			if (damageEventPlayer.length === 0) { return }

			//grabbing each event type for ease
			const damageEventPlayerCritHits = damageEventPlayer.filter(event => event.sourceModifier === SourceModifier.CRITICAL)
			const damageEventPlayerDirectHits = damageEventPlayer.filter(event => event.sourceModifier === SourceModifier.DIRECT)
			const damageEventPlayerCritDirectHits = damageEventPlayer.filter(event => event.sourceModifier === SourceModifier.CRITICAL_DIRECT)

			//taking the mean to represent the probabilities
			crit = (damageEventPlayerCritHits.length + damageEventPlayerCritDirectHits.length) / (damageEventPlayer.length)
			DH = (damageEventPlayerDirectHits.length + damageEventPlayerCritDirectHits.length) / (damageEventPlayer.length)

			//finding the average modifier based on ability
			const averageCritMod = math.mean(damageEventPlayer.map(event => event.critMod))
			const averageDHMod = math.mean(damageEventPlayer.map(event => event.DHMod))

			//ensuring related crits/DH don't go above 100% and below related base
			const critAdjusted = Math.min(Math.max(crit - averageCritMod, BASE_CRIT_PROBABILITY), 1)
			const DHAdjusted = Math.min(Math.max(DH - averageDHMod, 0), 1)

			//push to table. note: probabilities are stated in xx.x% and rounding must be taken into account since any amounts higher don't count.
			this.estCritDH[player] = {
				crit: Math.floor(critAdjusted / ROUNDING_FACTOR) * ROUNDING_FACTOR,
				DH: Math.floor(DHAdjusted / ROUNDING_FACTOR) * ROUNDING_FACTOR,
			}
		})
		this.completeInitialized = true
	}

	/**
	 * @param {number} timestamp - desired timestamp to get the crit/dh modifier
	 * @param {Actor} actor - desired actor to get their specific crit/dh modifier
	 * @returns {{number, number}} {crit, DH} - object containing the crits and DH modifiers at specified timestamp for specified actor
	 */
	public getCritDHMod(timestamp: number, actor: Actor['id']) {
		const events = this.damageEvent.find(event => event.timestamp === timestamp && event.actor === actor)
		let crit = 0
		let DH = 0
		if (events != null) {
			crit += events.critMod
			DH += events.DHMod
		}
		crit = Math.min(Math.max(crit, 0), 1)
		DH = Math.min(Math.max(DH, 0), 1)
		const critType = events !== undefined ? events.critType : CRIT_DH_TYPES.normal
		const DHType = events !== undefined ? events.DHType : CRIT_DH_TYPES.normal
		return {crit, DH, critType, DHType}
	}

	/**
	 * @param {number} timestamp - desired timestamp to get the unmodified crit/dh (note: this only works if there is an associated damage event)
	 * @param {Actor} actor - desired actor to get their specific unmodified crit/dh
	 * @returns {{number, number, string, string}} {crit, DH, critType, DHType} - object containing the crits and DH for specified timestamp for specified actor
	 */
	public getCritDH(timestamp: number, actor: Actor['id']) {
		//to initialize. for some reason a direct call to this.estcritDH without running onComplete() even when it's a dependency
		if (!this.completeInitialized) { this.onComplete() }

		let crit = 0
		let DH = 0
		const instance = this.estCritDH
		if (instance[actor] != null) {
			crit += instance[actor].crit
			DH += instance[actor].DH
		}
		crit += this.getCritDHMod(timestamp, actor).crit
		DH += this.getCritDHMod(timestamp, actor).DH
		const critType = this.getCritDHMod(timestamp, actor).critType
		const DHType = this.getCritDHMod(timestamp, actor).DHType
		return {
			crit: Math.min(Math.max(crit, 0), 1),
			DH: Math.min(Math.max(DH, 0), 1),
			critType: critType,
			DHType: DHType,
		}
	}

	/**
	 * @param {number} timestamp - desired timestamp to get the crit multiplier
	 * @param {Actor} actor - desired actor to get their specific crit multiplier
	 * @returns {number} multiplier - object containing the crits and DH for specified actor at specified timestamp
	 */
	public getCritMulti(timestamp: number, actor: Actor['id']) {
		//to initialize. for some reason a direct call to this.estcritDH without running onComplete() even when it's a dependency won't allow for values
		if (!this.completeInitialized) { this.onComplete() }

		//assumption: when crit mod >= 1, then the value for crit multiplier will be taken as if crit is only modded by non-guaranteed mods
		/*math concepts:
			- Math.min ensures crit doesn't go above 100%.
			- Math.max ensures crit doesn't go below 0%. Note: calculated crit is already forced to be minimum of base value so no operation is performed over that value in relation to this. Consider changing if there are ever statuses that reduced crit that is tracked in xivanalysis.
			- Math.floor removes any integers from crit mod, e.g. critmod = 210%, then math.floor makes it 10% instead which is in line with our assumption (asumption: guaranteed modifiers are always 100% and no addition of statuses otherwise makes the modifier go above 100%). */
		const critForMultiplier = Math.min(Math.max(this.getCritDHMod(timestamp, actor).crit - Math.floor(this.getCritDHMod(timestamp, actor).crit), 0)
			+ this.estCritDH[actor].crit, 1)

		const multiplier = critForMultiplier - BASE_CRIT_PROBABILITY + BASE_CRIT_MULTIPLIER
		return multiplier
	}
}
