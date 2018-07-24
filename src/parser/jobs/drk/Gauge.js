import React, {Fragment} from 'react'

import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// Actions that consume blood (50)
const BLOOD_ACTIONS = [
  ACTIONS.BLOODSPILLER,
  ACTIONS.QUIETUS,
  ACTIONS.DELIRIUM,
]

// Actions that generate blood and mana under blood weapon (3, 480mp).  Physical Damage actions.
const BLOOD_WEAPON_GCDS = [
	// Auto
	ACTIONS.ATTACK,
	// Combo GCDs
	ACTIONS.HARD_SLASH,
	ACTIONS.SYPHON_STRIKE,
	ACTIONS.SOULEATER,
	ACTIONS.SPINNING_SLASH,
	ACTIONS.POWER_SLASH,
	// other GCDs
	ACTIONS.BLOODSPILLER,
	ACTIONS.QUIETUS,
	// oGCDs
	ACTIONS.PLUNGE,
	ACTIONS.CARVE_AND_SPIT,
]

// system
const MAX_BLOOD = 100
const MAX_MANA = 9480
const MANA_PER_OUT_OF_COMBAT_TICK = 568 // DA is used 1-3 ticks pre pull, if at all.
// mana costs
const DARK_ARTS_MANA_COST = 2400
const DARK_PASSENGER_MANA_COST = 2400
const THE_BLACKEST_NIGHT_MANA_COST = 2400
const UNMEND_MANA_COST = 480
const ABYSSAL_DRAIN_MANA_COST = 1320
const UNLEASH_MANA_COST = 1080
// blood costs
const BLOOD_ACTION_BLOOD_COST = 50
// mana gain
const BLOOD_WEAPON_MANA_GAIN = 480
const SYPHON_STRIKE_MANA_GAIN = 1200
const SYPHON_STRIKE_GRIT_MANA_BONUS = 1200
const DELIRIUM_MANA_GAIN = 2400
// blood gain
const BLOOD_WEAPON_BLOOD_GAIN = 3
const SOULEATER_BLOOD_GAIN = 10

export default class Gauge extends Module {
  static handle = 'gauge'
  static dependencies = [
	'cooldowns',
	'suggestions',
  ]

  // -----
  // Properties
  // -----
  // state
  _currentMana = MAX_MANA - (DARK_ARTS_MANA_COST)
  //max or missing 1 DA + 0-3 mana ticks to start the fight.
  //give 1 use worth of leg room, and floor as needed.
  _currentBlood = 0
  _wastedBlood = 0
  _wastedMana = 0
  _meleeComboChain = 0 //magic numbers. 1,2,3 - 1,4,5.
  // counters
  _countBloodWeapon = 0
  _countBloodPrice = 0
  _countDelirium = 0
  _countDeliriumBloodWeaponExtensions = 0
  _countDeliriumBloodPriceExtensions = 0
  _countCarveAndSpit = 0
  _countDAPS = 0  // Dark Arts Power Slash    (3 in hate chain, better hate mod than 2).
  _countDASS = 0  // Dark Arts Spinning Slash (2 in hate chain)
  // flags
  _bloodWeaponActive = false
  _bloodPriceActive = false
  _darkArtsActive = false
  _theBlackestNightActive = false
  _gritActive = false
  // parse flags
  _usedDAOpener = -1 //-1 unmarked, 0 false, 1 true

  constructor(...args) {
	super(...args)
	this.addHook('cast', {by: 'player'}, this._onCast)
	this.addHook('removebuff', {
        by: 'player',
        abilityId: STATUSES.BLOOD_PRICE.id,
    }, this._onRemoveBloodPrice)
	this.addHook('removebuff', {
	  by: 'player',
	  abilityId: STATUSES.BLOOD_WEAPON.id,
	}, this._onRemoveBloodWeapon)
	this.addHook('removebuff', {
	  by: 'player',
	  abilityId: STATUSES.DARK_ARTS.id,
	}, this._onRemoveDarkArts)
	this.addHook('removebuff', {
	  by: 'player',
	  abilityId: STATUSES.THE_BLACKEST_NIGHT.id,
	}, this._onRemoveTheBlackestNight)
	this.addHook('removebuff', {
	  by: 'player',
	  abilityId: STATUSES.GRIT.id,
	}, this._onRemoveGrit())
	this.addHook('death', {to: 'player'}, this._onDeath)
	this.addHook('complete', this._onComplete)
  }

  _onCast(event) {
	const abilityId = event.ability.guid
	// blood weapon resources
	if(this._bloodWeaponActive) {
	    if(BLOOD_WEAPON_GCDS.includes(abilityId)) {
		  this._onGainBlood(BLOOD_WEAPON_BLOOD_GAIN)
		  this._onGainMana(BLOOD_WEAPON_MANA_GAIN)
		}
	}
	if(abilityId === ACTIONS.SOULEATER) {
	  this._onGainBlood(SOULEATER_BLOOD_GAIN)
	}
	// generate mana
	if(abilityId === ACTIONS.SYPHON_STRIKE) {
		this._onGainMana(SYPHON_STRIKE_MANA_GAIN)
		if(this._gritActive) {
			this._onGainMana(SYPHON_STRIKE_GRIT_MANA_BONUS)
		}
	}

	if(abilityId === ACTIONS.BLOOD_WEAPON) {
	  this._countBloodWeapon += 1
	  this._bloodWeaponActive = true
	}
	if(abilityId === ACTIONS.BLOOD_PRICE) {
	  this._countBloodPrice += 1
	  this._bloodPriceActive = true
	}
	if(abilityId === ACTIONS.DELIRIUM) {
	  this._countDelirium += 1
	  this._onGainMana(DELIRIUM_MANA_GAIN)
	  if(this._bloodWeaponActive) {
	    this._countDeliriumBloodWeaponExtensions += 1
	  }
	  if(this._bloodPriceActive) {
	    this._countDeliriumBloodPriceExtensions += 1
	  }
	}
  }

  _onGainBlood(gainedBlood) {
	if(this._currentMana + gainedBlood > MAX_BLOOD) {
	  this._wastedBlood += (this._currentBlood + gainedBlood) - MAX_BLOOD
	  this._currentBlood = MAX_BLOOD
	} else {
	  this._currentBlood += gainedBlood
	}
  }

  _onGainMana(gainedMana) {
    if(this._currentMana + gainedMana > MAX_MANA) {
      this._wastedMana += (this._currentMana + gainedMana) - MAX_MANA
      this._currentMana = MAX_MANA
	} else {
      this._currentMana += gainedMana
	}
  }

  _onRemoveBloodPrice() {
    this._bloodPriceActive = false
  }

  _onRemoveBloodWeapon() {
	this._bloodWeaponActive = false
  }

  _onRemoveDarkArts() {
    // check for a DA opener
	if(this._darkArtsActive === -1) {
	  // either a dropped log or an opener DA
	  // the -1 hopefully locks out drops later on
	  this._usedDAOpener = this._darkArtsActive ? 1 : 0
	}
	// remove DA status
	this._darkArtsActive = false
	// check if DA was consumed by an action, increment DA tally if so
  }

  _onRemoveGrit() {
    this._gritActive = false
  }

  _onRemoveTheBlackestNight() {
	// check if damage popped TBN or if it expired.
	// ?????
  }

  _onDeath() {
	this._wastedBlood += this._currentBlood
	this._wastedMana += this._currentMana
	this._currentBlood = 0
	this._currentMana = 0
  }

  _onComplete() {
	// wasted blood
	// wasted DA uses
	// wasted mana
	// dropped melee combos
	// better spent enmity DAPSvsDASS
	// carve and spit without DA
	// plunge count
  }
}
