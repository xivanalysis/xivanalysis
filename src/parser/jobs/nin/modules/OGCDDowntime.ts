import {Events} from 'event'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'

const KASSATSU_FIRST_USE_OFFSET = 1000 // After opening Suiton
const MUG_FIRST_USE_OFFSET = 6000 // After second combo GCD
const BUNSHIN_FIRST_USE_OFFSET = 7000 // After second combo GCD (second weave)
const TRICK_FIRST_USE_OFFSET = 10000 // After fourth combo GCD
const DWAD_FIRST_USE_OFFSET = 12250 // After SF
const TCJ_FIRST_USE_OFFSET = 17250 // After two Ninjutsu
const MEISUI_FIRST_USE_OFFSET = 20750 // After TCJ

export class OGCDDowntime extends CooldownDowntime {
	override trackedCds = [
		{
			cooldowns: [this.data.actions.KASSATSU],
			firstUseOffset: KASSATSU_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.MUG],
			firstUseOffset: MUG_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.BUNSHIN],
			firstUseOffset: BUNSHIN_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.TRICK_ATTACK],
			firstUseOffset: TRICK_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.DREAM_WITHIN_A_DREAM],
			firstUseOffset: DWAD_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.TEN_CHI_JIN],
			firstUseOffset: TCJ_FIRST_USE_OFFSET,
		},
		{
			cooldowns: [this.data.actions.MEISUI],
			firstUseOffset: MEISUI_FIRST_USE_OFFSET,
		},
	]

	private dreamTimestamps: number[] = []

	override countUsage(event: Events['action']) {
		if (event.action !== this.data.actions.DREAM_WITHIN_A_DREAM.id) {
			return true
		}

		if (this.dreamTimestamps.indexOf(event.timestamp) > -1) {
			return false
		}

		this.dreamTimestamps.push(event.timestamp)
		return true
	}
}
