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
const DARK_ARTS_CARVE_BOOST_POTENCY = 350
const DARK_ARTS_MANA_COST = 2400
const BLOODSPILLER_BLOOD_POTENCY = 135
const BLOODSPILLER_BLOOD_COST = 50

// -----
// Simulator fun time
// ------
// -----
// Meters
// ------
const MAX_MANA = 9480
const MAX_BLOOD = 100
//const MANA_PER_OUT_OF_COMBAT_TICK = 568 // DA should be used at least 2 ticks pre pull
//const DARKSIDE_MANA_COST = 600

const BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_BLOOD_AMOUNT = 1
const BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_MANA_AMOUNT = 120
const BLOOD_PRICE_BLOOD_PASSIVE_RATE = 3000
const BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT = 4
const BLOOD_PRICE_MAX_DURATION = 15000

//using this as a lookup table instead of a collector
const RESOURCE_STATUS_EFFECTS = {
	[STATUSES.ANOTHER_VICTIM.id]: {
		duration: 15000,
		type: 'debuff',
		expire_mana: MAX_MANA * 0.2,
		expire_blood: 0,
		activate_mana: MAX_MANA * 0.3,
		activate_blood: 0,
	},
	[STATUSES.BLACKEST_NIGHT.id]: {
		duration: 7000,
		type: 'buff',
		expire_mana: 0,
		expire_blood: 0,
		activate_mana: 0,
		activate_blood: 50,
	},
}

const MANA_MODIFIERS = {
	// generators
	[ACTIONS.DELIRIUM.id]: {value: 2400},
	// spenders
	[ACTIONS.DARKSIDE.id]: {value: -600},
	[ACTIONS.DARK_ARTS.id]: {value: -2400},
	[ACTIONS.DARK_PASSENGER.id]: {value: -2400},
	[ACTIONS.THE_BLACKEST_NIGHT.id]: {value: -2400},
	[ACTIONS.ABYSSAL_DRAIN.id]: {value: -1320},
	[ACTIONS.UNLEASH.id]: {value: -1080},
	[ACTIONS.UNMEND.id]: {value: -480},
	[ACTIONS.GRIT.id]: {value: -1200},
}

const BLOOD_MODIFIERS = {
	// spenders
	[ACTIONS.BLOODSPILLER.id]: {value: -50},
	[ACTIONS.QUIETUS.id]: {value: -50},
	[ACTIONS.DELIRIUM.id]: {value: -50},
}

//aoe abilities that generate resource on hits
const AOE_GENERATORS = {
	[ACTIONS.SALTED_EARTH.id]: {mana: 0, blood: 1},
	[ACTIONS.QUIETUS.id]: {mana: 480, blood: 0},
}

// Actions that generate blood and mana under blood weapon (Physical Damage actions - 3 blood, 480mp).
// redundant, but this keeps consistency with the other mappings
const BLOOD_WEAPON_GENERATORS = {
	// Auto
	[ACTIONS.ATTACK.id]: {mana: 480, blood: 3},
	// Combo GCDs
	[ACTIONS.HARD_SLASH.id]: {mana: 480, blood: 3},
	[ACTIONS.SYPHON_STRIKE.id]: {mana: 480, blood: 3},
	[ACTIONS.SOULEATER.id]: {mana: 480, blood: 3},
	[ACTIONS.SPINNING_SLASH.id]: {mana: 480, blood: 3},
	[ACTIONS.POWER_SLASH.id]: {mana: 480, blood: 3},
	// other GCDs
	[ACTIONS.BLOODSPILLER.id]: {mana: 480, blood: 3},
	[ACTIONS.QUIETUS.id]: {mana: 480, blood: 3},
	// oGCDs
	[ACTIONS.PLUNGE.id]: {mana: 480, blood: 3},
	[ACTIONS.CARVE_AND_SPIT.id]: {mana: 480, blood: 3},
	//[ACTIONS.SALTED_EARTH.id]: {mana: 480, blood: 3},
}

// Actions that generate resources in GCD combo
const COMBO_GENERATORS = {
	[ACTIONS.SOULEATER.id]: {mana: 0, blood: 10},
	[ACTIONS.SYPHON_STRIKE.id]: {mana: 1200, blood: 0},
}
// Combo actions that generate bonus resource if grit is active
const COMBO_GRIT_GENERATORS = {
	[ACTIONS.SYPHON_STRIKE.id]: {mana: 1200, blood: 0},
}

export default class Resources extends Module {
	static handle = 'resourcesim'
	static title = 'Resource Analyzer'
	static dependencies = [
		'buffs',
		'gcds',
		'suggestions',
		'checklist',
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
	// tracker stacks
	_mana_total_modifiers = []
	_blood_total_modifiers = []
	// -----
	// Parser Stats
	// -----
	_firstDamageEvent = true
	_bloodPriceStartTime = undefined
	_darksideRemoveTimestamp = undefined
	// -----
	// Evaluation units
	// -----
	_darkArtsOpener = undefined
	_droppedTBNs = 0
	_noDACarve = 0
	//timestamps for TBN and sole
	_resourceBuffTimestamps = {}

	constructor(...args) {
		super(...args)
		this.addHook('cast', {by: 'player'}, this._onCast)
		//if aoe damage events ever replace the single damage events, blood weapon gain will have to be tracked here
		//this.addHook('aoedamage', {by: 'player', abilityId: [ACTIONS.QUIETUS, ACTIONS.SALTED_EARTH]}, this._onAoEDamageDealt)
		this.addHook('damage', {by: 'player'}, this._onDamageDealt)
		this.addHook('damage', {to: 'player'}, this._onDamageTaken)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.DARKSIDE.id}, this._darksideApply)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.DARKSIDE.id}, this._darksideRemove)
		this.addHook('applybuff', {by: 'player', abilityId: STATUSES.BLOOD_PRICE.id}, this._bloodPriceStart)
		this.addHook('removebuff', {by: 'player', abilityId: STATUSES.BLOOD_PRICE.id}, this._bloodPriceEnd)
		this.addHook(['applybuff', 'applydebuff'], {by: 'player', abilityId: Object.keys(RESOURCE_STATUS_EFFECTS).map(Number)}, this._onApplyResourceStatuses)
		this.addHook(['removebuff', 'removedebuff'], {by: 'player', abilityId: Object.keys(RESOURCE_STATUS_EFFECTS).map(Number)}, this._onRemoveResourceStatuses)
		this.addHook('death', {by: 'player'}, this._onDeath)
		this.addHook('complete', this._onComplete)
	}

	// -----
	// Resource Utility Methods
	// -----

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
			this._mana_total_modifiers.push({ability: ability, value: value})
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
			this._blood_total_modifiers.push({ability: ability, value: value})
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

	// noinspection JSMethodCanBeStatic
	_bindToCeiling(op1, op2, ceiling) {
		return {waste: op1 + op2 > ceiling ? (op1 + op2 - ceiling) : 0, result: op1 + op2 > ceiling ? ceiling : (op1 + op2)}
	}

	// -----
	// simulator util
	// ------

	_onDeath() {
		this.dumpResources()
	}

	_onCast(event) {
		const abilityId = event.ability.guid
		if (MANA_MODIFIERS.hasOwnProperty(abilityId)) {
			this.modifyMana(event.ability, MANA_MODIFIERS[abilityId].value)
		}
		if (BLOOD_MODIFIERS.hasOwnProperty(abilityId)) {
			this.modifyBlood(event.ability, BLOOD_MODIFIERS[abilityId].value)
		}
		if (this.gcds.inGCDCombo()) {
			if (COMBO_GENERATORS.hasOwnProperty(abilityId)) {
				const entry = COMBO_GENERATORS[abilityId]
				this.modifyMana(event.ability, entry.mana)
				this.modifyBlood(event.ability, entry.blood)
			}
			if (this.buffs.gritActive()) {
				if (COMBO_GRIT_GENERATORS.hasOwnProperty(abilityId)) {
					const entry = COMBO_GRIT_GENERATORS[abilityId]
					this.modifyMana(event.ability, entry.mana)
					this.modifyBlood(event.ability, entry.blood)
				}
			}
		}
		//one off case for checking for DA-less carve n spit, which we can then make a suggestion for because this is really bad
		if (ACTIONS.CARVE_AND_SPIT.id === abilityId && !this.buffs.darkArtsActive()) {
			//great why are we here
			this._noDACarve += 1
			this.modifyMana(event.ability, 1200)
		}
	}

	_onApplyResourceStatuses(event) {
		const abilityId = event.ability.guid
		if (abilityId === STATUSES.ANOTHER_VICTIM.id) {
			this._resourceBuffTimestamps[abilityId] = event.timestamp
		}
		// no need to check for TBN, since we can resolve it with part of the event return
	}

	_onRemoveResourceStatuses(event) {
		//safety net, since we're getting buffs and debuffs
		const abilityId = event.ability.guid
		const entry = RESOURCE_STATUS_EFFECTS[abilityId]
		if (abilityId === STATUSES.ANOTHER_VICTIM.id) {
			const applicationTime = this._resourceBuffTimestamps[abilityId]
			//+/-100ms demonstrated wiggle room for the pop to show up.
			if (event.timestamp - applicationTime <= (entry.duration - 100)) {
				//popped
				this.modifyBlood(event.ability, entry.activate_blood)
				this.modifyMana(event.ability, entry.activate_mana)
			} else {
				//expired
				this.modifyBlood(event.ability, entry.expire_blood)
				this.modifyMana(event.ability, entry.expire_mana)
			}
		}
		if (abilityId === STATUSES.BLACKEST_NIGHT.id) {
			//absorbed := total damage absorbed
			//absorb := damage left in the shield
			const poppedTBN = event.absorb === 0
			if (poppedTBN) {
				//popped
				this.modifyBlood(event.ability, entry.activate_blood)
				this.modifyMana(event.ability, entry.activate_mana)
			} else {
				//expired
				this.modifyBlood(event.ability, entry.expire_blood)
				this.modifyMana(event.ability, entry.expire_mana)
				if (abilityId === STATUSES.BLACKEST_NIGHT) {
					this._droppedTBNs += 1
				}
			}
		}

	}

	// ----

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

	_bloodPriceStart(event) {
		this._bloodPriceStartTime = event.timestamp
	}

	_bloodPriceEnd(event) {
		//if we didn't see the start event, we just have to assume a full duration gain
		let ticks = (BLOOD_PRICE_MAX_DURATION / BLOOD_PRICE_BLOOD_PASSIVE_RATE) * BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT
		if (this._bloodPriceStartTime !== undefined) {
			ticks = Math.round((event.timestamp - this._bloodPriceStartTime) / BLOOD_PRICE_BLOOD_PASSIVE_RATE) * BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT
		}
		this.modifyBlood(ACTIONS.BLOOD_PRICE, BLOOD_PRICE_BLOOD_PASSIVE_AMOUNT * ticks)
	}

	//this.correctMana(event.sourceResources.mp)
	_onDamageDealt(event) {
		// check if it's the first damage event
		if (this._firstDamageEvent && event.sourceResources) {
			// check if mana is missing or not, if so then DA opener was used
			this._darkArtsOpener = (event.sourceResources.mp !== event.sourceResources.maxMP)
			// set mana to the value found here
			this.modifyMana(undefined, event.sourceResources.mp)
		}
		this._firstDamageEvent = false
		// blood weapon outgoing damage
		const abilityId = event.ability.guid
		if (this.buffs.bloodWeaponActive() && BLOOD_WEAPON_GENERATORS.hasOwnProperty(abilityId)) {
			const entry = BLOOD_WEAPON_GENERATORS[abilityId]
			this.modifyMana(ACTIONS.BLOOD_WEAPON, entry.mana)
			this.modifyBlood(ACTIONS.BLOOD_WEAPON, entry.blood)
		}
		if (AOE_GENERATORS.hasOwnProperty(abilityId)) {
			const entry = AOE_GENERATORS[abilityId]
			this.modifyMana(event.ability, entry.mana)
			this.modifyBlood(event.ability, entry.blood)
		}
	}

	_onDamageTaken() { //event) {
		// blood price incoming damage
		if (this.buffs.bloodPriceActive()) {
			this.modifyBlood(ACTIONS.BLOOD_PRICE, BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_BLOOD_AMOUNT)
			this.modifyMana(ACTIONS.BLOOD_PRICE, BLOOD_PRICE_BLOOD_DAMAGE_TRIGGERED_MANA_AMOUNT)
		}
	}

	// -----
	// ui
	// -----

	_onComplete() {
		//dump unused resources
		this.dumpResources()
		// UI
		this.checklist.add(new Rule({
			name: 'Mana Utilization',
			description: <Fragment>Capping on mana or dying is a potency loss of about {DARK_ARTS_MANA_POTENCY} per {DARK_ARTS_MANA_COST
			} mana for each wasted <ActionLink {...ACTIONS.DARK_ARTS}/>.  It's better to clip and use the mana than to cap.</Fragment>,
			requirements: [
				new Requirement({
					name: 'Mana Utilization',
					percent: ((Math.abs(this._totalSpentMana) / (this._totalGainedMana)) * 100),
				}),
			],
		}))
		this.checklist.add(new Rule({
			name: 'Blood Utilization',
			description: <Fragment>Capping on blood is a potency loss of about {BLOODSPILLER_BLOOD_POTENCY
			} per {BLOODSPILLER_BLOOD_COST} blood.  Some cases of blood cap loss are unavoidable due to <ActionLink {...ACTIONS.THE_BLACKEST_NIGHT}/> usage.  Remember that <ActionLink {...ACTIONS.BLOODSPILLER}
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
					Missing a <ActionLink {...ACTIONS.DARK_ARTS}/> pre-pull for use during the opener is a large potency and enmity loss.  Using DA at around 6-7 seconds before pull gives ample time to use it as well as gain two pre-fight mana ticks.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					Mana was logged at 100% when the fight started, which implies that a <ActionLink {...ACTIONS.DARK_ARTS}/> was not used pre-pull.  Ignore this if mana was at 100% for some other reason.
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
					You missed out on {this._droppedTBNs * BLOODSPILLER_BLOOD_COST} blood ({BLOODSPILLER_BLOOD_POTENCY} potency) or {this._droppedTBNs * DARK_ARTS_MANA_POTENCY} potency of Dark Arts buffs.
				</Fragment>,
			}))
		}
		if (this._noDACarve > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.CARVE_AND_SPIT.icon,
				content: <Fragment>
					One or more <ActionLink {...ACTIONS.CARVE_AND_SPIT}/> was used without <ActionLink {...ACTIONS.DARK_ARTS}/>
					.  Even though this generates the same amount of mana as <ActionLink {...ACTIONS.SYPHON_STRIKE}/>, it loses out on {DARK_ARTS_CARVE_BOOST_POTENCY} potency, a massive part of your damage as a DRK.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					You missed out on {this._noDACarve * DARK_ARTS_CARVE_BOOST_POTENCY} potency due to {this._noDACarve} unbuffed carves.
				</Fragment>,
			}))
		}
		if (this._wastedBlood > BLOODSPILLER_BLOOD_COST) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.BLOODSPILLER.icon,
				content: <Fragment>
					You wasted blood, and could have gotten more uses
					of <ActionLink {...ACTIONS.BLOODSPILLER}/> or other spenders during the fight
					(minimum {BLOODSPILLER_BLOOD_POTENCY} gained average combo potency increase each.)
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You wasted a total of {this._wastedBlood} from capping, deaths, end of fight leftovers.
				</Fragment>,
			}))
		}
		if (this._wastedMana > DARK_ARTS_MANA_COST) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.DARK_ARTS.icon,
				content: <Fragment>
					You wasted mana, and could have gotten more uses
					of <ActionLink {...ACTIONS.DARK_ARTS}/> or other spenders during the fight
					(minimum {DARK_ARTS_MANA_POTENCY} for {DARK_ARTS_MANA_COST} mana gained average combo potency increase each.)
				</Fragment>,
				severity: SEVERITY.MEDIUM,
				why: <Fragment>
					You wasted a total of {this._wastedMana} from capping, deaths, end of fight leftovers.
				</Fragment>,
			}))
		}
	}

	static _aggregateSignedEntries(arr) {
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
				// non ability gains need to be aggregated and applied at the end
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
			} else if (negativeAggregator.hasOwnProperty(name)) {
				negativeAggregator[name] += entry.value
			} else {
				negativeAggregator[name] = entry.value
				negativeEventAggregator[name] = entry.ability
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
		const bloodDump = Resources._aggregateSignedEntries(this._blood_total_modifiers)
		const manaDump = Resources._aggregateSignedEntries(this._mana_total_modifiers)
		return {manaGenerators: manaDump.positiveOut, manaSpenders: manaDump.negativeOut, bloodGenerators: bloodDump.positiveOut, bloodSpenders: bloodDump.negativeOut}
	}

	_keyScumCounter = 0

	_convertKVListToTable(list) {
		const rows = []
		while (list.length > 0) {
			const entry = list.pop()
			this._keyScumCounter += 1
			const key = entry.name + '-' + this._keyScumCounter.toString()
			rows.push(
				<tr key={key.toString() + '-row'} style={{margin: 0, padding: 0}}>
					<td key={{key} + '-name'}>{entry.name}</td>
					<td key={{key} + '-value'}>{entry.value}</td>
				</tr>
			)
		}
		this._keyScumCounter += 1
		const key = this._keyScumCounter.toString()
		return <Fragment key={key + '-fragment'}>
			<table key={key + '-table'}>
				<tbody key={key + '-tbody'}>
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
			key: 'key-bloodSpenders',
			title: {
				key: 'title-bloodSpenders',
				content: <Fragment>Blood Spenders</Fragment>,
			},
			content: {
				key: 'content-bloodSpenders',
				content: this._convertKVListToTable(lists.bloodSpenders),
			},
		})
		panels.push({
			key: 'key-bloodGenerators',
			title: {
				key: 'title-bloodGenerators',
				content: <Fragment>Blood Generators</Fragment>,
			},
			content: {
				key: 'content-bloodGenerators',
				content: this._convertKVListToTable(lists.bloodGenerators),
			},
		})
		panels.push({
			key: 'key-manaSpenders',
			title: {
				key: 'title-manaSpenders',
				content: <Fragment>Mana Spenders</Fragment>,
			},
			content: {
				key: 'content-manaSpenders',
				content: this._convertKVListToTable(lists.manaSpenders),
			},
		})
		panels.push({
			key: 'key-manaGenerators',
			title: {
				key: 'title-manaGenerators',
				content: <Fragment>Mana Generators</Fragment>,
			},
			content: {
				key: 'content-manaGenerators',
				content: this._convertKVListToTable(lists.manaGenerators),
			},
		})
		return <Fragment>
			<Message>
				<p>Blood Used vs Blood Gained: {this._totalSpentBlood * -1} / {this._totalGainedBlood + (this._wastedBlood * -1)} - {Math.floor(((this._totalSpentBlood * -1)/(this._totalGainedBlood + (this._wastedBlood * -1))) * 10000) / 100}%</p>
				<p>Mana Used vs Mana Gained: {this._totalSpentMana * -1} / {this._totalGainedMana + (this._wastedMana * -1)} - {Math.floor(((this._totalSpentMana * -1)/(this._totalGainedMana + (this._wastedMana * -1))) * 10000) / 100}%</p>
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
