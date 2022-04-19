import {Action} from 'data/ACTIONS'
import {Status} from 'data/STATUSES'
import {Event, Events, SourceModifier} from 'event'
import math from 'mathjsCustom'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'

const BASE_CRIT_PROBABILITY = 0.05 //5%
const BASE_CRIT_MULTIPLIER = 0.4
const ROUNDING_FACTOR = 0.001 //to match rounding used in game for crit rates

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
	private damageEvent: Array<{actor: Actor['id'], timestamp: number, action: Status['id'] | Action['id'], critMod: number, DHMod: number, sourceModifier: number}> = []
	private statusEvent: Array<{actor: Actor['id'], timestamp: number, action: Status['id'] | Action['id'], critRate: number, DHRate: number}> = []
	private critPartyModifierCurrent: {[actor: Actor['id']]: {currentModifier: number}} = {}
	private critEnemyModifierCurrent: {[actor: Actor['id']]: {currentModifier: number}} = {}
	private DHPartyModifierCurrent: {[actor: Actor['id']]: {currentModifier: number}} = {}
	private appliedStatuses: Array<{actor: Actor['id'], status: Status['id']}> = [] //reasoning is that bard's statuses are reapplied without removal. this is to catch those

	//crit and DH Modifier variables
	private critPartyModifiers: {[id: Status['id']]: {strength: number}} = {
		[this.data.statuses.BATTLE_LITANY.id]: {strength: 0.1},
		[this.data.statuses.DEVILMENT.id]: {strength: 0.2},
		[this.data.statuses.THE_WANDERERS_MINUET.id]: {strength: 0.02},
		[this.data.statuses.INNER_RELEASE.id]: {strength: 1},
		//TO DO: these below moves only increase crit for the next weaponskill, not the oGCDs between
		[this.data.statuses.REASSEMBLED.id]: {strength: 1},
		[this.data.statuses.OPO_OPO_FORM.id]: {strength: 1},
		[this.data.statuses.LIFE_SURGE.id]: {strength: 1},
	}

	private critEnemyModifiers: {[id: Status['id']]: {strength: number}} = {
		[this.data.statuses.CHAIN_STRATAGEM.id]: {strength: 0.1},
	}

	private DHPartyModifiers: {[id: Status['id']]: {strength: number}} = {
		[this.data.statuses.ARMYS_PAEON.id]: {strength: 0.03},
		[this.data.statuses.BATTLE_VOICE.id]: {strength: 0.2},
		[this.data.statuses.DEVILMENT.id]: {strength: 0.2},
		[this.data.statuses.REASSEMBLED.id]: {strength: 1},
		[this.data.statuses.INNER_RELEASE.id]: {strength: 1},
	}

	//to store the above crits, dh in an easy to call variable
	private critPartyStatuses: Array<Status['id']> = [
		this.data.statuses.BATTLE_LITANY.id,
		this.data.statuses.DEVILMENT.id,
		this.data.statuses.THE_WANDERERS_MINUET.id,
		this.data.statuses.INNER_RELEASE.id,
		this.data.statuses.REASSEMBLED.id,
		this.data.statuses.OPO_OPO_FORM.id,
		this.data.statuses.LIFE_SURGE.id,
	]
	private critEnemyStatuses: Array<Status['id']> = [
		this.data.statuses.CHAIN_STRATAGEM.id,
	]
	private DHPartyStatuses: Array<Status['id']> = [
		this.data.statuses.DEVILMENT.id,
		this.data.statuses.REASSEMBLED.id,
		this.data.statuses.INNER_RELEASE.id,
		this.data.statuses.BATTLE_VOICE.id,
		this.data.statuses.ARMYS_PAEON.id,
	]

	//these are abilities that will automatically crit or direct hit which will skew results and should automatically be removed from the respective DH or Crit calculations
	private autoCritAbilities: Array<Action['id']> = [
		this.data.actions.STARFALL_DANCE.id,
		this.data.actions.CHAOTIC_CYCLONE.id,
		this.data.actions.INNER_CHAOS.id,
		this.data.actions.PRIMAL_REND.id,
	]
	private autoDHAbilities: Array<Action['id']> = [
		this.data.actions.STARFALL_DANCE.id,
		this.data.actions.CHAOTIC_CYCLONE.id,
		this.data.actions.INNER_CHAOS.id,
		this.data.actions.PRIMAL_REND.id,
	]

	override initialise() {
		//6.1 additions
		if (this.parser.patch.after('6.08')) {
			this.autoCritAbilities.push(this.data.actions.MIDARE_SETSUGEKKA.id)
			this.autoCritAbilities.push(this.data.actions.KAESHI_SETSUGEKKA.id)
			this.autoCritAbilities.push(this.data.actions.OGI_NAMIKIRI.id)
			this.autoCritAbilities.push(this.data.actions.KAESHI_NAMIKIRI.id)

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
				critRate: event.expectedCritRate ?? 0 * ROUNDING_FACTOR, //crit rate is stated in 0.1
				DHRate: event.directHitRate ?? 0,
			})
			return
		}

		if (event.targets.length === 0) { return }
		const action = event.cause.type === 'action' ? event.cause.action : event.cause.status
		const abilityCritModifier = this.autoCritAbilities.includes(action) ? 1 : 0
		const abilityDHModifier = this.autoDHAbilities.includes(action) ? 1 : 0
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
					critMod: this.critPartyModifierCurrent[event.source].currentModifier + this.critEnemyModifierCurrent[target.target].currentModifier + abilityCritModifier,
					DHMod: this.DHPartyModifierCurrent[event.source].currentModifier + abilityDHModifier,
					sourceModifier: target.sourceModifier,
				}
			)
		})
	}

	private petDamage(event: Events['damage']) {
		const owner: Actor['id'] | undefined = this.actors.get(event.source)?.owner?.id
		//don't consider statuses as already considered in Damage and not expecting pets to have ticks
		if (event.targets.length === 0 || event.cause.type === 'status' || owner === undefined) { return }
		const action = event.cause.action
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
				}
			)
		}
		)
	}

	private critPartyApply(event: Events['statusApply']) {
		//check if applied already
		if (this.appliedStatuses.filter(applied => applied.actor === event.target && applied.status === event.status).length !== 0) { return }
		//used just in case a bad status gets through
		if (this.critPartyModifiers[event.status] === undefined) { return }
		this.appliedStatuses.push({actor: event.target, status: event.status})
		//adds strength during window
		this.critPartyModifierCurrent[event.target].currentModifier += this.critPartyModifiers[event.status].strength
	}

	private critPartyRemove(event: Events['statusRemove']) {
		//used just in case a bad status gets through
		if (this.critPartyModifiers[event.status] === undefined) { return }
		this.appliedStatuses = this.appliedStatuses.filter(applied => event.target !== applied.actor && event.status !== applied.status)
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
		//used just in case a bad status gets through
		if (this.DHPartyModifierCurrent[event.status] === undefined) { return }
		this.appliedStatuses.push({actor: event.target, status: event.status})
		//adds strength during window
		this.DHPartyModifierCurrent[event.target].currentModifier += this.DHPartyModifiers[event.status].strength
	}

	private DHPartyRemove(event: Events['statusRemove']) {
		//used just in case a bad status gets through
		if (this.DHPartyModifierCurrent[event.status] === undefined) { return }
		this.appliedStatuses = this.appliedStatuses.filter(applied => event.target !== applied.actor && event.status !== applied.status)
		//adds strength during window
		this.DHPartyModifierCurrent[event.target].currentModifier -= this.DHPartyModifiers[event.status].strength
	}

	private onComplete() {

		this.playerControlled.forEach(player => {
			let crit: number = 0
			let DH: number = 0

			//get it from statuses if available
			if (this.statusEvent.filter(event => event.actor === player).length !== 0) {
				crit = this.statusEvent.filter(event => event.actor === player)[0].critRate
				DH = this.statusEvent.filter(event => event.actor === player)[0].DHRate
				//push to table
				this.estCritDH[player] = {
					crit: Math.floor(crit / ROUNDING_FACTOR) * ROUNDING_FACTOR,
					DH: Math.floor(DH / ROUNDING_FACTOR) * ROUNDING_FACTOR,
				}
				return
			}

			const damageEventPlayer = this.damageEvent.filter(event => event.actor === player
					&& event.DHMod <= 1 //guaranteed direct hits will skew the data even if this comes at the expense of crit
					&& event.critMod <= 1  - BASE_CRIT_PROBABILITY) //guaranteed crits will skew the data even if this comes at the expense of DH
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
		return {crit, DH}
	}

	/**
	 * @param {number} timestamp - desired timestamp to get the unmodified crit/dh (note: this only works if there is an associated damage event)
	 * @param {Actor} actor - desired actor to get their specific unmodified crit/dh
	 * @returns {{number, number}} {crit, DH} - object containing the crits and DH for specified timestamp for specified actor
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
		return {
			crit: Math.min(Math.max(crit, 0), 1),
			DH: Math.min(Math.max(DH, 0), 1),
		}
	}

	/**
	 * @param {number} timestamp - desired timestamp to get the crit multiplier
	 * @param {Actor} actor - desired actor to get their specific crit multiplier
	 * @returns {number} multiplier - object containing the crits and DH for specified actor at specified timestamp
	 */
	public getCritMulti(timestamp: number, actor: Actor['id']) {
		//to initialize. for some reason a direct call to this.estcritDH without running onComplete() even when it's a dependency
		if (!this.completeInitialized) { this.onComplete() }

		//assumption: when crit mod = 1, then the value for crit multiplier will be taken as if crit is unmodded
		const critForMultiplier = this.getCritDHMod(timestamp, actor).crit < 1 - BASE_CRIT_PROBABILITY ? this.getCritDHMod(timestamp, actor).crit
			: Math.min(Math.max(this.getCritDHMod(timestamp, actor).crit - 1, 0), 1)
			+ this.estCritDH[actor].crit

		const multiplier = critForMultiplier - BASE_CRIT_PROBABILITY + BASE_CRIT_MULTIPLIER
		return multiplier
	}
}
