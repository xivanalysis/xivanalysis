import ACTIONS from 'data/ACTIONS'
import CooldownDowntime from 'parser/core/modules/CooldownDowntime'

export default class GeneralCDDowntime extends CooldownDowntime {
	//Time that Jump deems ok for a OGCD to be down : ^)
	// eslint-disable-next-line no-magic-numbers
	allowedDowntime = 4000
	//Additionally if you use Acceleration at 10s preppull you'd need time for it to come back off CD
	//We don't bother with Fleche/C6 because they should be used on the second GCD of the fight, opening combo + potion second combo + fleche/c6
	firstUseOffsetPerOgcd = {
		[ACTIONS.ACCELERATION.id]: 25000,
		[ACTIONS.SWIFTCAST.id]: 15000,
		[ACTIONS.MANAFICATION.id]: 25000,
		[ACTIONS.EMBOLDEN.id]: 15000,
	}
	trackedCds = [
		ACTIONS.MANAFICATION.id,
		ACTIONS.EMBOLDEN.id,
		ACTIONS.FLECHE.id,
		ACTIONS.CONTRE_SIXTE.id,
		ACTIONS.ACCELERATION.id,
		ACTIONS.SWIFTCAST.id,
	]
}
