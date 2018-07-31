import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Accordion, Message} from 'semantic-ui-react'

// -----
// UI stuff
// -----
const DARK_ARTS_MANA_POTENCY = 140
const DARK_ARTS_MANA_COST = 2400
const BLOODSPILLER_BLOOD_POTENCY = 135
const BLOODSPILLER_BLOOD_COST = 50

// -----
// Simulator fun time
// ------
// -----
// Meters
// ------

//const MAX_BLOOD = 100
const MAX_MANA = 9480
const MAX_BLOOD = 100
const MANA_PER_OUT_OF_COMBAT_TICK = 568 // DA is used 1-3 ticks pre pull, if at all. Good to have regardless
//const DARKSIDE_MANA_COST = 600

const BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_BLOOD_AMOUNT = 1
const BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_MANA_AMOUNT = 120
const BLOOD_PRICE_BLOOD_PASSIVE_RATE = 3000
const BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT = 4
const BLOOD_PRICE_MAX_DURATION = 15000

const RESOURCE_STATUS_EFFECTS = [
	{id: STATUSES.ANOTHER_VICTIM.id,
		duration: 15000,
		type: 'debuff',
		expire_mana: MAX_MANA * 0.2,
		expire_blood: 0,
		activate_mana: MAX_MANA * 0.3,
		activate_blood: 0,
	},
	{id: STATUSES.BLACKEST_NIGHT.id,
		duration: 7000,
		type: 'buff',
		expire_mana: 0,
		expire_blood: 0,
		activate_mana: 0,
		activate_blood: 50,
	},
]

const MANA_MODIFIERS = [
	// generators
	{id: ACTIONS.DELIRIUM.id, value: 2400},
	// spenders
	{id: ACTIONS.DARKSIDE.id, value: -600},
	{id: ACTIONS.DARK_ARTS.id, value: -2400},
	{id: ACTIONS.DARK_PASSENGER.id, value: -2400},
	{id: ACTIONS.THE_BLACKEST_NIGHT.id, value: -2400},
	{id: ACTIONS.ABYSSAL_DRAIN.id, value: -1320},
	{id: ACTIONS.UNLEASH.id, value: -1080},
	{id: ACTIONS.UNMEND.id, value: -480},
	{id: ACTIONS.GRIT.id, value: -1200},
	{id: ACTIONS.DARKSIDE.id, value: -600},
]

const BLOOD_MODIFIERS = [
	// spenders
	{id: ACTIONS.BLOODSPILLER.id, value: -50},
	{id: ACTIONS.QUIETUS.id, value: -50},
	{id: ACTIONS.DELIRIUM.id, value: -50},
]

//aoe abilities that generate resource on hits
/* taken out for now, as the damage events work just fine.
const AOE_GENERATORS = [
	{id: ACTIONS.SALTED_EARTH.id, mana: 0, blood: 1},
	{id: ACTIONS.QUIETUS.id, mana: 120, blood: 0},
]
*/

// Actions that generate blood and mana under blood weapon (Physical Damage actions - 3 blood, 480mp).
// redundant, but this keeps consistency with the other mappings
const BLOOD_WEAPON_GENERATORS = [
	// Auto
	{id: ACTIONS.ATTACK.id, mana: 480, blood: 3},
	// Combo GCDs
	{id: ACTIONS.HARD_SLASH.id, mana: 480, blood: 3},
	{id: ACTIONS.SYPHON_STRIKE.id, mana: 480, blood: 3},
	{id: ACTIONS.SOULEATER.id, mana: 480, blood: 3},
	{id: ACTIONS.SPINNING_SLASH.id, mana: 480, blood: 3},
	{id: ACTIONS.POWER_SLASH.id, mana: 480, blood: 3},
	// other GCDs
	{id: ACTIONS.BLOODSPILLER.id, mana: 480, blood: 3},
	{id: ACTIONS.QUIETUS.id, mana: 480, blood: 3},
	// oGCDs
	{id: ACTIONS.PLUNGE.id, mana: 480, blood: 3},
	{id: ACTIONS.CARVE_AND_SPIT.id, mana: 480, blood: 3},
]

// Actions that generate resources in GCD combo
const COMBO_GENERATORS = [
	{id: ACTIONS.SOULEATER.id, mana: 0, blood: 10},
	{id: ACTIONS.SYPHON_STRIKE.id, mana: 1200, blood: 0},
]
// Combo actions that generate bonus resource if grit is active
const COMBO_GRIT_GENERATORS = [
	{id: ACTIONS.SYPHON_STRIKE.id, mana: 1200, blood: 0},
]

export default class Resources extends Module {
	static handle = 'resourcesim'
	static title = 'Resource Analyzer'
	static dependencies = [
		'library',
		'buffs',
		'gcds',
		'suggestions',
		'checklist',
		'downtime',
	]

	// -----
	// Resource utilities
	// -----
	_totalGainedMana = 0
	_totalSpentMana = 0
	_totalDroppedMana = 0
	_currentMana = 0
	_wastedMana = 0
	_totalGainedBlood = 0
	_totalSpentBlood = 0
	_totalDroppedBlood = 0
	_currentBlood = 0
	_wastedBlood = 0

	_mana_total_modifiers = []
	_blood_total_modifiers = []

	modifyMana(ability, value) {
		if (value !== 0) {
			if (value > 0) {
				this._totalGainedMana += value
			} else {
				this._totalSpentMana += value
			}
			const currentManaSnapshot = this._currentMana
			const vals = this._bindToCeiling(currentManaSnapshot, value, MAX_MANA)
			this._wastedMana += vals.waste
			this._currentMana = vals.result
			if (ability !== undefined) {
				this._mana_total_modifiers.push({ability: ability, value: value})
			} else {
				this._mana_total_modifiers.push({ability: undefined, value: value})
			}
		}
	}
	modifyBlood(ability, value) {
		if (value !== 0) {
			if (value > 0) {
				this._totalGainedBlood += value
			} else {
				this._totalSpentBlood += value
			}
			const currentBloodSnapshot = this._currentBlood
			const vals = this._bindToCeiling(currentBloodSnapshot, value, MAX_BLOOD)
			this._wastedBlood += vals.waste
			this._currentBlood = vals.result
			if (ability !== undefined) {
				this._blood_total_modifiers.push({ability: ability, value: value})
			}
		}
	}
	dumpResources() {
		this._wastedMana += this._currentMana
		this._wastedBlood += this._currentBlood
		this._totalDroppedMana += this._currentMana
		this._totalDroppedBlood += this._currentBlood
		this._currentMana = 0
		this._currentBlood = 0
	}

	_darkArtsOpener = undefined
	/*
	_lastSimulatedManaSnapshot = undefined
	correctMana(value) {
		//difference between current mana and the last recorded mana
		this.modifyMana(undefined, value - this._lastSimulatedManaSnapshot)
		// save snapshot for next cycle
		this._lastSimulatedManaSnapshot = this._currentMana
		// push corrected value
		this._currentMana = value
	}
	*/


	// noinspection JSMethodCanBeStatic
	_bindToCeiling(op1, op2, ceiling) {
		return {waste: op1 + op2 > ceiling ? (op1 + op2 - ceiling) : 0, result: op1 + op2 > ceiling ? ceiling : (op1 + op2)}
	}

	// -----
	// simulator util
	// ------

	constructor(...args) {
		super(...args)
		// this.addHook('init', this._onInit)
		this.addHook('cast', {by: 'player'}, this._onCast)
		//this.addHook('aoedamage', {by: 'player', abilityId: [ACTIONS.QUIETUS, ACTIONS.SALTED_EARTH]}, this._onAoEDamageDealt)
		this.addHook('damage', {by: 'player'}, this._onDamageDealt)
		this.addHook('damage', {to: 'player'}, this._onDamageTaken)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.DARKSIDE.id}, this._darksideApply)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.DARKSIDE.id}, this._darksideRemove)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.BLOOD_PRICE.id}, this._bloodPriceStart)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.BLOOD_PRICE.id}, this._bloodPriceEnd)
		this.addHook(['applybuff', 'applydebuff'], {by: 'player', abilityId: RESOURCE_STATUS_EFFECTS.map(entry => entry.id)}, this._onApplyResourceStatuses)
		this.addHook(['removebuff', 'removedebuff'], {by: 'player', abilityId: RESOURCE_STATUS_EFFECTS.map(entry => entry.id)}, this._onRemoveResourceStatuses)
		this.addHook('death', {by: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
		//should be spending full mana + 3 out of combat ticks
		this.modifyMana(undefined, MAX_MANA + (MANA_PER_OUT_OF_COMBAT_TICK * 2))
	}

	_droppedTBNs = 0
	_noDAcarve = 0

	_onCast(event) {
		const abilityId = event.ability.guid
		if (MANA_MODIFIERS.some(entry => entry.id === abilityId)) {
			this.modifyMana(event.ability, MANA_MODIFIERS.find(entry => entry.id === abilityId).value)
		}
		if (BLOOD_MODIFIERS.some(entry => entry.id === abilityId)) {
			this.modifyBlood(event.ability, BLOOD_MODIFIERS.find(entry => entry.id === abilityId).value)
		}
		if (this.gcds.inGCDCombo()) {
			if (COMBO_GENERATORS.some(entry => entry.id === abilityId)) {
				const entry = COMBO_GENERATORS.find(entry => entry.id === abilityId)
				this.modifyMana(event.ability, entry.mana)
				this.modifyBlood(event.ability, entry.blood)
			}
			if (this.buffs.gritActive()) {
				if (COMBO_GRIT_GENERATORS.some(entry => entry.id === abilityId)) {
					const entry = COMBO_GRIT_GENERATORS.find(entry => entry.id === abilityId)
					this.modifyMana(event.ability, entry.mana)
					this.modifyBlood(event.ability, entry.blood)
				}
			}
		}
		//one off case for checking for DA-less carve n spit, which we can then make a suggestion for because this is really bad
		if (ACTIONS.CARVE_AND_SPIT.id === abilityId && !this.buffs.darkArtsActive()) {
			//great why are we here
			this._noDAcarve += 1
			this.modifyMana(event.ability, 1200) //dravi had to go test this out since literally nobody knows this number
		}
	}

	//timestamps for TBN and sole
	_resourceBuffTimestamps = {}


	_onApplyResourceStatuses(event) {
		//safety net, since we're getting buffs and debuffs
		const abilityId = event.ability.guid
		if (RESOURCE_STATUS_EFFECTS.some(entry => entry.id === abilityId)) {
			this._resourceBuffTimestamps[abilityId] = event.timestamp
		}
	}

	_onRemoveResourceStatuses(event) {
		//safety net, since we're getting buffs and debuffs
		const abilityId = event.ability.guid
		if (RESOURCE_STATUS_EFFECTS.some(entry => entry.id === abilityId)) {
			const entry = RESOURCE_STATUS_EFFECTS.find(entry => entry.id === abilityId)
			const applicationTime = this._resourceBuffTimestamps[abilityId]
			if (event.timestamp - applicationTime < entry.duration) {
				//popped
				this.modifyBlood(event.ability, entry.activate_blood)
				this.modifyMana(event.ability, entry.activate_mana)
			} else {
				//expired
				this.modifyBlood(event.ability, entry.expire_blood)
				this.modifyMana(event.ability, entry.expire_mana)
				//special handling for TBN since it's basically throwing away damage
				if (abilityId === STATUSES.BLACKEST_NIGHT) {
					this._droppedTBNs += 1
				}
			}
		}

	}

	/* Only need this if the individual damage ticks ever get removed.
	_onAoEDamageDealt(event) {
		const abilityId = event.ability.guid
		const hitCount = event.hits.length
		if (AOE_GENERATORS.find(entry => entry.id === abilityId)) {
			const entry = AOE_GENERATORS.find(entry => entry.id === abilityId)
			this.modifyMana(event.ability, entry.mana * hitCount)
			this.modifyBlood(event.ability, entry.blood * hitCount)
		}
		if (this.buffs.bloodWeaponActive() && BLOOD_WEAPON_GENERATORS.some(entry => entry.id === abilityId)) {
			const entry = BLOOD_WEAPON_GENERATORS.find(entry => entry.id === abilityId)
			this.modifyMana(event.ability, entry.mana)
			this.modifyBlood(event.ability, entry.blood)
		}
	}
	*/

	_firstDamageEvent = true

	//this.correctMana(event.sourceResources.mp)
	_onDamageDealt(event) {
		// check if it's the first damage event
		if (this._firstDamageEvent) {
			// check if mana is missing or not, if so then DA opener was used
			this._darkArtsOpener = (event.sourceResources.mp !== event.sourceResources.maxMP)
		}
		this._firstDamageEvent = false
		// blood weapon outgoing damage
		const abilityId = event.ability.guid
		if (this.buffs.bloodWeaponActive() && BLOOD_WEAPON_GENERATORS.some(entry => entry.id === abilityId)) {
			const entry = BLOOD_WEAPON_GENERATORS.find(entry => entry.id === abilityId)
			this.modifyMana(ACTIONS.BLOOD_WEAPON, entry.mana)
			this.modifyBlood(ACTIONS.BLOOD_WEAPON, entry.blood)
		}
	}

	_bloodPriceStartTime = undefined

	_bloodPriceStart(event) {
		this._bloodPriceStartTime = event.timestamp
	}

	_onDamageTaken() { //event) {
		// blood price incoming damage
		if (this.buffs.bloodPriceActive()) {
			this.modifyBlood(ACTIONS.BLOOD_PRICE, BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_BLOOD_AMOUNT)
			this.modifyMana(ACTIONS.BLOOD_PRICE, BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_MANA_AMOUNT)
		}
	}

	_darksideRemoveTimestamp = undefined

	_darksideApply(event) {
		if (this._darksideRemoveTimestamp !== undefined) {
			//give mana ticks for how long they had it down for
			//using 2% of max mana per tick
			const ticks = Math.floor((event.timestamp - this._darksideRemoveTimestamp) / 3000)
			this.modifyMana(undefined, ticks * Math.floor(MAX_MANA * 0.02))
			//reset darkside in case something breaks
			this._darksideRemoveTimestamp = undefined
		}
	}

	_darksideRemove(event) {
		this._darksideRemoveTimestamp = event.timestamp
	}

	_bloodPriceEnd(event) {
		//if we didn't see the start event, we just have to assume a full duration gain
		let ticks = (BLOOD_PRICE_MAX_DURATION / BLOOD_PRICE_BLOOD_PASSIVE_RATE) * BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT
		if (this._bloodPriceStartTime !== undefined) {
			ticks = Math.round((event.timestamp - this._bloodPriceStartTime) / BLOOD_PRICE_BLOOD_PASSIVE_RATE) * BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT
		}
		this.modifyBlood(ACTIONS.BLOOD_PRICE, BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT * ticks)
	}

	_onDeath() {
		this.dumpResources()
	}

	_onComplete() {
		//dump unused resources
		this.dumpResources()
		// -----
		// UI module output
		// -----
		// -----
		// DA opener check
		// noDA cs check
		// -----
		// future cool things
		// graph mana and blood capping eventually
		// flag negative mana points on debug
		// wasted mana and blood isn't working as intended atm, saving this for another day.
		// ------
		//
		/*
		const manaCostDA = MANA_MODIFIERS.find(entry => entry.id === ACTIONS.DARK_ARTS.id).value
		const bloodCostBS = BLOOD_MODIFIERS.find(entry => entry.id === ACTIONS.BLOODSPILLER.id).value
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.DARK_ARTS.icon,
			content: <Fragment>
				You wasted mana, and could have gotten more uses
				of <ActionLink {...ACTIONS.DARK_ARTS}/> or other spenders during the fight
				(minimum {DARK_ARTS_MANA_COST_POTENCY_ESTIMATOR} potency each.)
			</Fragment>,
			severity: (this.fetchWastedMana() <= (manaCostDA * 2) ? SEVERITY.MINOR : this.fetchWastedMana() <= (manaCostDA * 6) ? SEVERITY.MEDIUM : SEVERITY.MAJOR),
			why: <Fragment>
				You wasted {this.fetchWastedMana()} Mana, or {Math.floor(this.fetchWastedMana() / manaCostDA)} <ActionLink {...ACTIONS.DARK_ARTS}/> uses by not spending generated mana, or a minimum
				of {Math.floor(this.fetchWastedMana() / manaCostDA) * DARK_ARTS_MANA_COST_POTENCY_ESTIMATOR} potency.
			</Fragment>,
		}))
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.BLOODSPILLER.icon,
			content: <Fragment>
				You wasted blood, and could have gotten more uses
				of <ActionLink {...ACTIONS.BLOODSPILLER}/> or other spenders during the fight
				(minimum {BLOODSPILLER_BLOOD_COST_POTENCY_ESTIMATOR} potency each.)
			</Fragment>,
			severity: this.fetchWastedBlood() <= (bloodCostBS * 1) ? SEVERITY.MINOR : this.fetchWastedBlood() <= (bloodCostBS * 3) ? SEVERITY.MEDIUM : SEVERITY.MAJOR,
			why: <Fragment>
				You wasted {this.fetchWastedBlood()} Blood, or {Math.floor(this.fetchWastedBlood() / bloodCostBS)} <ActionLink {...ACTIONS.BLOODSPILLER}/> uses by not spending generated blood, or a minimum
				of {Math.floor(this.fetchWastedBlood() / bloodCostBS) * BLOODSPILLER_BLOOD_COST_POTENCY_ESTIMATOR} potency.
			</Fragment>,
		}))
		return this._totalGainedBlood + ' ' + this._totalGainedMana + '||' + this._totalSpentBlood + ' ' + this._totalSpentMana + ' '
		*/
		// IF MANA DETECTOR STOPS WORKING
		//use fight downtime to try and predict free darkside down ticks
		//really we want to make this decision for each segment, if it's worth it to take off DS or not
		//so instead, we'll spread out time by 5, so a tick happens once every 15 seconds of downtime.
		//const possible_mana_gain = Math.max((((this.downtime.getDowntime() / 5 ) / 3000) * MANA_PER_OUT_OF_COMBAT_TICK) - DARKSIDE_MANA_COST, 0)
		//
		this.checklist.add(new Rule({
			name: 'Mana Utilization',
			description: <Fragment>Mana generated in the fight needs to be used, otherwise you face a potency loss of about {DARK_ARTS_MANA_POTENCY} per {DARK_ARTS_MANA_COST
			} blood, as you could have spent the mana on <ActionLink {...ACTIONS.DARK_ARTS}/>.  The biggest loss will always be from deaths. Don't be afraid to clip if you have to, but also remember to have enough mana for a needed <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/>
				or <ActionLink {...ACTIONS.DARK_ARTS}/><ActionLink {...ACTIONS.CARVE_AND_SPIT}/>combo.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Mana Utilization',
					percent: ((Math.abs(this._totalSpentMana) / (this._totalGainedMana)) * 100),
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: 'Blood Utilization',
			description: <Fragment> Blood needs to be spent fairly quickly once acquired, otherwise capping will occur, otherwise you face a potency loss of about {BLOODSPILLER_BLOOD_POTENCY
			} per {BLOODSPILLER_BLOOD_COST} blood.  Some cases of blood cap loss are unavoidable due to <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/> usage, but otherwise aim for as high a percent as possible.  Remember that <ActionLink {...ACTIONS.BLOODSPILLER}
			/> does not reset your <ActionLink {...ACTIONS.SOULEATER}/>combo, consumes <ActionLink {...ACTIONS.DARK_ARTS}/>, and bypasses the major potency penalty from <ActionLink {...ACTIONS.GRIT}/>.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Blood Utilization',
					percent: ((Math.abs(this._totalSpentBlood) / (this._totalGainedBlood)) * 100),
				}),
			],
		}))
		if (!this._darkArtsOpener) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DARK_ARTS.icon,
				content: <Fragment>
					Missing a <ActionLink {...ACTIONS.DARK_ARTS}/> pre-pull for use during the opener is a large potency and enmity loss.  Pressing DA at around 6-7 seconds before pull gives ample time to use it.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					Mana was logged at 100% when the fight started, which implies that a <ActionLink {...ACTIONS.DARK_ARTS}/> was not used pre-pull.  If mana was at 100% for some other reason, then hopefully this is redundant.
				</Fragment>,
			}))
		}
		if (this._droppedTBNs > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THE_BLACKEST_NIGHT.icon,
				content: <Fragment>
					One or more <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/> applications did not pop, and thus did not generate blood.  This equates to throwing away the mana you could have spent on a <ActionLink {...ACTIONS.DARK_ARTS}/>.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					You missed out on {this._droppedTBNs * 50} blood ({BLOODSPILLER_BLOOD_POTENCY} potency) or {this._droppedTBNs * 140} potency of Dark Arts buffs.
				</Fragment>,
			}))
		}
		if (this._totalDroppedBlood > BLOODSPILLER_BLOOD_COST) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.BLOODSPILLER.icon,
				content: <Fragment>
					You wasted blood, and could have gotten more uses
					of <ActionLink {...ACTIONS.BLOODSPILLER}/> or other spenders during the fight
					(minimum {BLOODSPILLER_BLOOD_POTENCY} gained average combo potency increase each.)
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You wasted a total of {this._totalDroppedBlood} from deaths and end of fight leftovers.
				</Fragment>,
			}))
		}
		if (this._totalDroppedMana > DARK_ARTS_MANA_COST) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DARK_ARTS.icon,
				content: <Fragment>
					You wasted mana, and could have gotten more uses
					of <ActionLink {...ACTIONS.DARK_ARTS}/> or other spenders during the fight
					(minimum {DARK_ARTS_MANA_POTENCY} for {DARK_ARTS_MANA_COST} mana gained average combo potency increase each.)
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You wasted a total of {this._totalDroppedMana} from deaths and end of fight leftovers.
				</Fragment>,
			}))
		}
	}

	// noinspection JSMethodCanBeStatic
	_aggregateSignedEntries(arr) {
		const positiveAggregator = {}
		const positiveEventAggregator = {}
		const negativeAggregator = {}
		const negativeEventAggregator = {}
		const positiveOut = []
		const negativeOut = []
		let envNet = 0
		while (arr.length > 0) {
			const entry = arr.pop()
			let name = 'Unknown'
			if (entry.ability !== undefined) {
				name = entry.ability.name
			} else {
				// environmental gains need to be aggregated and applied at the end
				envNet += entry.value
				continue
			}
			if (entry.value > 0) {
				if (positiveAggregator.hasOwnProperty(name)) {
					positiveAggregator[name] += entry.value
				} else {
					positiveAggregator[name] = entry.value
					positiveEventAggregator[name] = entry.ability
				}
			} else {
				//this isn't a lonely if idc it looks better this way
				// eslint-disable-next-line
				if (negativeAggregator.hasOwnProperty(name)) {
					negativeAggregator[name] += entry.value
				} else {
					negativeAggregator[name] = entry.value
					negativeEventAggregator[name] = entry.ability
				}
			}
		}
		if (envNet !== 0) {
			//pushed the combined environmental set into the appropriate box
			if (envNet > 0) {
				positiveOut.push({name: 'Initial Mana and Regen', ability: undefined, value: envNet})
			} else {
				negativeOut.push({name: 'Initial Mana and Regen', ability: undefined, value: envNet})
			}
		}
		for (const property in positiveAggregator) {
			positiveOut.push({name: property, ability: positiveEventAggregator[property], value: positiveAggregator[property]})
		}
		for (const property in negativeAggregator) {
			negativeOut.push({name: property, ability: negativeEventAggregator[property], value: (negativeAggregator[property] * -1)})
		}
		return {positiveOut: positiveOut, negativeOut: negativeOut}
	}

	_filterResourceTrackingLists() {
		const bloodDump = this._aggregateSignedEntries(this._blood_total_modifiers)
		const manaDump = this._aggregateSignedEntries(this._mana_total_modifiers)
		return {manaGenerators: manaDump.positiveOut, manaSpenders: manaDump.negativeOut, bloodGenerators: bloodDump.positiveOut, bloodSpenders: bloodDump.negativeOut}
	}

	// noinspection JSMethodCanBeStatic
	_convertKVListToTable(list) {
		//I wish this could be an actual table, but apparently accordions break that. Just doing a simplistic variant
		const rows = []
		while (list.length > 0) {
			const entry = list.pop()
			/*
			rows.push(
				<p>
					<span style={{float: 'left'}}><p>{entry.name}</p></span>
					<span style={{float: 'right'}}><p>{entry.value}</p></span>
					<span style={{margin: '0 auto', width: '100px'}}><p>:</p></span>
				</p>)
				*/
			//there's 100% a better fix for TBN, but frankly i'm too tired to care right now
			rows.push(
				<tr style={{margin: 0, padding: 0}}>
					<td>{entry.name === 'undefined' ? 'The Blackest Night' : entry.name}</td>
					<td>{entry.value}</td>
				</tr>
			)
		}
		return <Fragment>
			<table>
				<tbody>
					{rows}
				</tbody>
			</table>
		</Fragment>
	}

	output() {
		// Mana usage and blood usage modules
		// make this into a pretty table
		// also include spenders and generators
		const panels = []
		const lists = this._filterResourceTrackingLists()
		panels.push({
			title: {
				key: 'bloodSpenders',
				content: <Fragment>Blood Spenders</Fragment>,
			},
			content: {
				key: 'bloodSpendersContent',
				content: this._convertKVListToTable(lists.bloodSpenders),
			},
		})
		panels.push({
			title: {
				key: 'bloodGenerators',
				content: <Fragment>Blood Generators</Fragment>,
			},
			content: {
				key: 'bloodGeneratorsContent',
				content: this._convertKVListToTable(lists.bloodGenerators),
			},
		})
		panels.push({
			title: {
				key: 'manaSpenders',
				content: <Fragment>Mana Spenders</Fragment>,
			},
			content: {
				key: 'manaSpendersContent',
				content: this._convertKVListToTable(lists.manaSpenders),
			},
		})
		panels.push({
			title: {
				key: 'manaGenerators',
				content: <Fragment>Mana Generators</Fragment>,
			},
			content: {
				key: 'manaGeneratorsContent',
				content: this._convertKVListToTable(lists.manaGenerators),
			},
		})
		return <Fragment>
			<Message>
				<p>Blood Used vs Blood Gained: {this._totalSpentBlood * -1} / {this._totalGainedBlood} - {Math.floor(((this._totalSpentBlood * -1)/this._totalGainedBlood) * 10000) / 100}%</p>
				<p>Mana Used vs Mana Gained: {this._totalSpentMana * -1} / {this._totalGainedMana} - {Math.floor(((this._totalSpentMana * -1)/this._totalGainedMana) * 10000) / 100}%</p>
			</Message>
			<Accordion
				exclusive={false}
				panels={panels}
				styled
				fluid
			/>
		</Fragment>
	}
}
