import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {Rule, Requirement} from 'parser/core/modules/Checklist'

//const DARK_ARTS_MANA_COST_POTENCY_ESTIMATOR =  140
//const BLOODSPILLER_BLOOD_COST_POTENCY_ESTIMATOR = 135

const MAX_MANA = 9480
const MAX_BLOOD = 100
const DARK_ARTS_MANA_POTENCY = 140
const DARK_ARTS_MANA_COST = 2400
const BLOODSPILLER_BLOOD_POTENCY = 135
const BLOODSPILLER_BLOOD_COST = 50

const BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_BLOOD_AMOUNT = 1
const BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_MANA_AMOUNT = 120
const BLOOD_PRICE_BLOOD_PASSIVE_RATE = 3000
const BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT = 4

const RESOURCE_STATUS_EFFECTS = [
	{id: STATUSES.ANOTHER_VICTIM.id, duration: 15000,
		expire_mana: MAX_MANA * 0.2, expire_blood: 0,
		activate_mana: MAX_MANA * 0.3, activate_blood: 0,
	},
	{id: STATUSES.BLACKEST_NIGHT.id, duration: 15000,
		expire_mana: 0, expire_blood: 0,
		activate_mana: 0, activate_blood: 50,
	},
]

const MANA_MODIFIERS = [
	// generators
	{id: ACTIONS.SYPHON_STRIKE.id, value: 1200},
	{id: ACTIONS.DELIRIUM.id, value: 2400},
	// spenders
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
const AOE_GENERATORS = [
	{id: ACTIONS.SALTED_EARTH.id, mana: 0, blood: 1},
	{id: ACTIONS.QUIETUS.id, mana: 120, blood: 0},
]

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
	static handle = 'resourceevaluator'
	static title = 'Resource Evaluator'
	static dependencies = [
		'library',
		'resources',
		'buffs',
		'gcds',
		'suggestions',
		'checklist',
	]

	_droppedTBNs = 0

	constructor(...args) {
		super(...args)
		// this.addHook('init', this._onInit)
		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('aoedamage', {by: 'player', abilityId: [ACTIONS.QUIETUS, ACTIONS.SALTED_EARTH]}, this._onAoEDamageDealt)
		this.addHook('damage', {by: 'player'}, this._onDamageDealt)
		this.addHook('damage', {to: 'player'}, this._onDamageTaken)
		this.addHook('applybuff', {by: 'player', abilityId: [STATUSES.ANOTHER_VICTIM.id, STATUSES.BLACKEST_NIGHT.id]}, this._onApplyResourceBuffs)
		this.addHook('removebuff', {by: 'player', abilityId: [STATUSES.ANOTHER_VICTIM.id, STATUSES.BLACKEST_NIGHT.id]}, this._onRemoveResourceBuffs)
		this.addHook('death', {by: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		if (MANA_MODIFIERS.some(entry => entry.id === abilityId)) {
			this.resources.modifyMana(MANA_MODIFIERS.find(entry => entry.id === abilityId).value)
		}
		if (BLOOD_MODIFIERS.some(entry => entry.id === abilityId)) {
			this.resources.modifyBlood(BLOOD_MODIFIERS.find(entry => entry.id === abilityId).value)
		}
		if (this.gcds.inGCDCombo()) {
			if (COMBO_GENERATORS.some(entry => entry.id === abilityId)) {
				const entry = COMBO_GENERATORS.find(entry => entry.id === abilityId)
				this.resources.modifyMana(entry.mana)
				this.resources.modifyBlood(entry.blood)
			}
			if (this.buffs.gritActive() && COMBO_GRIT_GENERATORS.some(entry => entry.id === abilityId)) {
				const entry = COMBO_GRIT_GENERATORS.find(entry => entry.id === abilityId)
				this.resources.modifyMana(entry.mana)
				this.resources.modifyBlood(entry.blood)
			}
		}
	}

	//timestamps for TBN and sole
	_resourceBuffTimestamps = {}


	_onApplyResourceBuffs(event) {
		//safety net
		const abilityId = event.ability.guid
		if (RESOURCE_STATUS_EFFECTS.some(entry => entry.id === abilityId)) {
			this._resourceBuffTimestamps[abilityId] = event.timestamp
		}
	}

	_onRemoveResourceBuffs(event) {
		const abilityId = event.ability.guid
		if (RESOURCE_STATUS_EFFECTS.some(entry => entry.id === abilityId)) {
			const entry = RESOURCE_STATUS_EFFECTS.find(entry => entry.id === abilityId)
			const applicationTime = this._resourceBuffTimestamps[abilityId]
			if (event.timestamp - applicationTime < entry.duration) {
				//popped
				this.resources.modifyBlood(entry.activate_blood)
				this.resources.modifyMana(entry.activate_mana)
			} else {
				//expired
				this.resources.modifyBlood(entry.expire_blood)
				this.resources.modifyMana(entry.expire_mana)
				//special handling for TBN since it's basically throwing away damage
				this._droppedTBNs += 1
			}
		}

	}

	_onAoEDamageDealt(event) {
		const abilityId = event.ability.guid
		const hitCount = event.hits.length
		if (AOE_GENERATORS.find(entry => entry.id === abilityId)) {
			const entry = AOE_GENERATORS.find(entry => entry.id === abilityId)
			this.resources.modifyMana(entry.mana * hitCount)
			this.resources.modifyBlood(entry.blood * hitCount)
		}
		if (this.buffs.bloodWeaponActive() && BLOOD_WEAPON_GENERATORS.some(entry => entry.id === abilityId)) {
			const entry = BLOOD_WEAPON_GENERATORS.find(entry => entry.id === abilityId)
			this.resources.modifyMana(entry.mana)
			this.resources.modifyBlood(entry.blood)
		}
	}

	_onDamageDealt(event) {
		const abilityId = event.ability.guid
		if (this.buffs.bloodWeaponActive() && BLOOD_WEAPON_GENERATORS.some(entry => entry.id === abilityId)) {
			const entry = BLOOD_WEAPON_GENERATORS.find(entry => entry.id === abilityId)
			this.resources.modifyMana(entry.mana)
			this.resources.modifyBlood(entry.blood)
		}
	}

	_onDamageTaken(event) {
		//blood price math
	}

	_onDeath() {
		this.resources.dumpResources()
	}

	_onComplete() {
		this.resources.dumpResources()
	}

	output(){
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
			severity: (this.resources.fetchWastedMana() <= (manaCostDA * 2) ? SEVERITY.MINOR : this.resources.fetchWastedMana() <= (manaCostDA * 6) ? SEVERITY.MEDIUM : SEVERITY.MAJOR),
			why: <Fragment>
				You wasted {this.resources.fetchWastedMana()} Mana, or {Math.floor(this.resources.fetchWastedMana() / manaCostDA)} <ActionLink {...ACTIONS.DARK_ARTS}/> uses by not spending generated mana, or a minimum
				of {Math.floor(this.resources.fetchWastedMana() / manaCostDA) * DARK_ARTS_MANA_COST_POTENCY_ESTIMATOR} potency.
			</Fragment>,
		}))
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.BLOODSPILLER.icon,
			content: <Fragment>
				You wasted blood, and could have gotten more uses
				of <ActionLink {...ACTIONS.BLOODSPILLER}/> or other spenders during the fight
				(minimum {BLOODSPILLER_BLOOD_COST_POTENCY_ESTIMATOR} potency each.)
			</Fragment>,
			severity: this.resources.fetchWastedBlood() <= (bloodCostBS * 1) ? SEVERITY.MINOR : this.resources.fetchWastedBlood() <= (bloodCostBS * 3) ? SEVERITY.MEDIUM : SEVERITY.MAJOR,
			why: <Fragment>
				You wasted {this.resources.fetchWastedBlood()} Blood, or {Math.floor(this.resources.fetchWastedBlood() / bloodCostBS)} <ActionLink {...ACTIONS.BLOODSPILLER}/> uses by not spending generated blood, or a minimum
				of {Math.floor(this.resources.fetchWastedBlood() / bloodCostBS) * BLOODSPILLER_BLOOD_COST_POTENCY_ESTIMATOR} potency.
			</Fragment>,
		}))
		return this.resources._totalGainedBlood + ' ' + this.resources._totalGainedMana + '||' + this.resources._totalSpentBlood + ' ' + this.resources._totalSpentMana + ' '
		*/
		this.checklist.add(new Rule({
			name: 'Mana Utilization',
			description: <Fragment>Mana generated in the fight needs to be used, otherwise you face a potency loss of about {DARK_ARTS_MANA_POTENCY} per {DARK_ARTS_MANA_COST}, as you could have spent the mana on
				<ActionLink {...ACTIONS.DARK_ARTS}/>.  The biggest loss will always be from deaths. Don't be afraid to clip if you have to, but also remember to have enough mana for a needed <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/>
				or <ActionLink {...ACTIONS.DARK_ARTS}/><ActionLink {...ACTIONS.CARVE_AND_SPIT}/>combo.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Mana Utilization',
					percent: (Math.abs(this.resources._totalSpentMana) / this.resources._totalGainedMana) * 100,
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: 'Blood Utilization',
			description: <Fragment> Blood needs to be spent fairly quickly once acquired, otherwise capping will occur.  Some cases of blood cap loss are unavoidable due to TBN usage, but otherwise aim for as high a percent as possible.  Remember that <ActionLink {...ACTIONS.BLOODSPILLER}
			/> does not reset your <ActionLink {...ACTIONS.SOULEATER}/>combo, and can be used effectively with <ActionLink {...ACTIONS.GRIT}/>and <ActionLink {...ACTIONS.DARK_ARTS}/>.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Blood Utilization',
					percent: (Math.abs(this.resources._totalSpentBlood) / this.resources._totalGainedBlood) * 100,
				}),
			],
		}))
		if (this._droppedTBNs > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.THE_BLACKEST_NIGHT.icon,
				content: <Fragment>
					One or more <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/> applications did not pop, and thus did not generate blood.  This equates to throwing away the mana you could have spent on a <ActionLink {...ACTIONS.DARK_ARTS}/>.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					You missed out on {this._droppedTBNs * 50} blood or {this._droppedTBNs * 140} potency of Dark Arts buffs.
				</Fragment>,
			}))
		}
	}
}
