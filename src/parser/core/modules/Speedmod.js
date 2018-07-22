import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

// TODO: astralUmbral depends on the spell being cast. It should probably be moved out into BLM-specific handling. I'm not handling it right now.
const STATUS_MAP = {
	[STATUSES.THE_ARROW.id]: {field: '_arrow', value: 10},
	[STATUSES.FEY_WIND.id]: {field: '_feyWind', value: 3},
	// TODO: Type1/Type2/RoF
	// TODO: Work out how haste is going to work
}

export default class Speedmod extends Module {
	static handle = 'speedmod'

	_arrow = 0
	_type1 = 0
	_type2 = 0
	_haste = 0
	_feyWind = 0
	_riddleOfFireMod = 0
	_astralUmbralMod = 0

	// These two have a base of 100, using getters to magic them up a bit
	get _riddleOfFire() { return 100 + this._riddleOfFireMod }
	get _astralUmbral() { return 100 + this._astralUmbralMod }

	constructor(...args) {
		super(...args)

		const ids = Object.keys(STATUS_MAP).map(key => parseInt(key, 10))
		const filter = {abilityId: ids, to: 'player'}
		this.addHook('applybuff', filter, this._onApplyBuff)
		this.addHook('removebuff', filter, this._onRemoveBuff)
	}

	_onApplyBuff(event) {
		const statusId = event.ability.guid
		const map = STATUS_MAP[statusId]
		let value = map.value

		// Arrow needs special handling 'cus of RR
		if (statusId === STATUSES.THE_ARROW.id) {
			// We need the extra data, skip the normal buff event
			value *= event.strengthModifier
		}

		this[map.field] = value
	}

	_onRemoveBuff(event) {
		const map = STATUS_MAP[event.ability.guid]
		this[map.field] = 0
	}

	// Retrieve the current speedmod
	get() {
		// Shh
		const {floor: f, ceil: c} = Math

		// I'm putting a large number through so I can compare at the ass end
		const gcdm = 100000

		// The formulas here are based on documentation from Theoryjerks.
		// Details and so on @ their channel: https://discord.gg/rkDkxQW
		const a = f(f(f((100 - this._arrow) * (100 - this._type1) / 100) * (100 - this._haste) / 100) - this._feyWind)
		const b = (this._type2 - 100) / -100

		const gcdc = f(f(f(c(a * b) * gcdm / 100) * this._riddleOfFire / 1000) * this._astralUmbral / 100)

		// With that done, we've got the modified 'GCD' in centiseconds, bump it back down to milli and compare
		return (gcdc * 10) / gcdm
	}
}
