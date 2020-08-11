import ACTIONS from 'data/ACTIONS'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

const KASSATSU_FIRST_USE_OFFSET = 1000 // After opening Suiton
const MUG_FIRST_USE_OFFSET = 6000 // After second combo GCD
const BUNSHIN_FIRST_USE_OFFSET = 7000 // After second combo GCD (second weave)
const TRICK_FIRST_USE_OFFSET = 10000 // After fourth combo GCD
const DWAD_FIRST_USE_OFFSET = 12250 // After SF
const TCJ_FIRST_USE_OFFSET = 17250 // After two Ninjutsu
const MEISUI_FIRST_USE_OFFSET = 20750 // After TCJ

export default class OGCDDowntime extends CooldownDowntime {
	trackedCds = [
		{
			cooldowns: [ACTIONS.KASSATSU],
			firstUseOffset: KASSATSU_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.MUG],
			firstUseOffset: MUG_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.BUNSHIN],
			firstUseOffset: BUNSHIN_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.TRICK_ATTACK],
			firstUseOffset: TRICK_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.DREAM_WITHIN_A_DREAM],
			firstUseOffset: DWAD_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.TEN_CHI_JIN],
			firstUseOffset: TCJ_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [ACTIONS.MEISUI],
			firstUseOffset: MEISUI_FIRST_USE_OFFSET,
		},
	]

	_dreamTimestamps = []

	countUsage(event) {
		if (event.ability.guid !== ACTIONS.DREAM_WITHIN_A_DREAM.id) {
			return true
		}

		if (this._dreamTimestamps.indexOf(event.timestamp) > -1) {
			return false
		}

		this._dreamTimestamps.push(event.timestamp)
		return true
	}
}
