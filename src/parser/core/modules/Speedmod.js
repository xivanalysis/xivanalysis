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
	static dependencies = [
		'arcanum', // We rely on its normaliser to handle arrow strength mod
	]

	// Track history of speedmods
	_history = [{speedmod: 1, start: 0, end: Infinity}]

	// Internal stuff used by normalise/_calculate
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

	normalise(events) {
		const types = ['applybuff', 'removebuff']
		const ids = Object.keys(STATUS_MAP).map(key => parseInt(key, 10))

		for (let i = 0; i < events.length; i++) {
			const event = events[i]

			// Only care about certain events to the player
			if (
				!event.ability ||
				!types.includes(event.type) ||
				!ids.includes(event.ability.guid) ||
				!this.parser.toPlayer(event)
			) { continue }

			const map = STATUS_MAP[event.ability.guid]
			let value = 0

			if (event.type === 'applybuff') {
				value = map.value

				// Arrow needs special handling due to RR
				if (event.ability.guid === STATUSES.THE_ARROW.id) {
					value *= event.strengthModifier
				}
			}

			this[map.field] = value

			// Recalculate the speedmod and save to history
			this._history[this._history.length - 1].end = event.timestamp-1
			this._history.push({
				speedmod: this._calculate(),
				start: event.timestamp,
				end: Infinity,
			})
		}

		return events
	}

	// Calculate the speedmod based on current class vars
	_calculate() {
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

	get(timestamp = this.parser.currentTimestamp) {
		return this._history.find(h => h.start <= timestamp && h.end >= timestamp).speedmod
	}
}
