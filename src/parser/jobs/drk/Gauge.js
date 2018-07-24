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

// Blood costs for actions that consume blood (all 50, but something something future proofing)
const BLOOD_ACTION_COSTS = {
  'ACTIONS.BLOODSPILLER': 50,
  'ACTIONS.QUIETUS': 50,
  'ACTIONS.DELIRIUM': 50,
}

// Actions that generate blood under blood wep.
const bloodGCDs = [
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
]

// Actions that generate mana under blood wep.  Either we use this table
const bloodWepManaGeneration = {
    // Auto
	'ACTIONS.ATTACK': 0,
	// Combo GCDs
	'ACTIONS.HARD_SLASH': 0,
	'ACTIONS.SYPHON_STRIKE': 0,
	'ACTIONS.SOULEATER': 0,
	'ACTIONS.SPINNING_SLASH': 0,
	'ACTIONS.POWER_SLASH': 0,
	// other GCDs
	'ACTIONS.BLOODSPILLER': 0,
}

// Maximums.  4 DA charges can fit into a meter, so we use this as an estimate.
const MAX_BLOOD = 100
const MAX_DARK_ARTS_USES = 4
const BLOOD_WEAPON_BLOOD_GAIN = 3
const SOULEATER_BLOOD_GAIN = 10
const DELIRIUM_DARK_ARTS_USES_GAIN = 1

export default class Gauge extends Module {
  static handle = 'gauge'
  static dependencies = [
	'cooldowns',
	'suggestions',
  ]

  // -----
  // Properties
  // -----
  // counters
  _blood = 0
  _wastedBlood = 0
  _wastedDarkArts = 0
  _countBloodWeapon = 0
  _countBloodPrice = 0
  _countDelirium = 0
  _countDAPS = 0  // Dark Arts Power Slash    (3 in hate chain, better hate mod than 2).
  _countDASS = 0  // Dark Arts Spinning Slash (2 in hate chain)
  // state
  _darkArtsUses = 4
  _bloodWeaponActive = false
  _bloodPriceActive = false
  _darkArtsActive = false
  _theBlackestNightActive = false
  // flags
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
	this.addHook('death', {to: 'player'}, this._onDeath)
	this.addHook('complete', this._onComplete)
  }

  _onCast(event) {
	const abilityId = event.ability.guid
	// blood weapon resources
	if(this._bloodWeaponActive) {
	    if(bloodGCDs.includes(abilityId)) {
		  this._onGainBlood(BLOOD_WEAPON_BLOOD_GAIN)
		}
		// blood weapon mana generation
	}
	if(abilityId === ACTIONS.SOULEATER) {
	  this._onGainBlood(SOULEATER_BLOOD_GAIN)
	}
	// generate mana
	if(abilityId === ACTIONS.SYPHON_STRIKE) {
		// generate syphon mana
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
	  this._onGainMana(DELIRIUM_DARK_ARTS_USES_GAIN)
	}
  }

  _onGainBlood(gainedBlood) {
	// handle blood over capping
  }

  _onGainMana(gainedDarkArtsUses) {
    if(this._darkArtsUses + gainedDarkArtsUses > MAX_DARK_ARTS_USES) {
      this._wastedDarkArts += (this._darkArtsUses + gainedDarkArtsUses) - MAX_DARK_ARTS_USES
      this._darkArtsUses = MAX_DARK_ARTS_USES
	} else {
      this._darkArtsUses += gainedDarkArtsUses
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
  }

  _onRemoveTheBlackestNight() {
	// check if damage popped TBN or if it expired.
	// ?????
  }

  _onDeath() {
	this._wastedBlood += this._blood
	this._wastedDarkArts += this._darkArtsUses
	this._blood = 0
	this._darkArtsUses = 0.5
  }

  _onComplete() {
	// wasted blood
	// wasted DA uses
	// wasted mana
	// dropped melee combos
	// better spent enmity DAPSvsDASS
  }
}
