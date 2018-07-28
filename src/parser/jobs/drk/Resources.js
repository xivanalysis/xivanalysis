import Module from 'parser/core/Module'

export default class Resources extends Module {
	static handle = 'resources'
	static title = 'Resources'
	static dependencies = [
		'library',
	]

	// -----
	// Internals
	// -----
	_currentMana = this.library.MAX_MANA
	_totalGainedMana = 0
	_totalSpentMana = 0
	_totalDroppedMana = 0
	_wastedMana = 0
	//_wastedManaInstances = []
	_currentBlood = 0
	_totalGainedBlood = 0
	_totalSpentBlood = 0
	_totalDroppedBlood = 0
	_wastedBlood = 0
	//_wastedBloodInstances = []
	//
	constructor(...args) {
		super(...args)
	}

	// -----
	// Accessors
	// -----
	fetchMana() {
		return this._currentMana
	}
	fetchBlood() {
		return this._currentBlood
	}
	fetchWastedMana() {
		return this._wastedMana
	}
	fetchWastedBlood() {
		return this._wastedBlood
	}
	modifyMana(value) {
		if (value !== 0) {
			if (value > 0) {
				this._totalGainedMana += value
			} else {
				this._totalSpentMana += value
			}
			const vals = Resources._bindToCeiling(this._currentMana, value, this.library.MAX_MANA)
			this._currentMana = vals.result
			this._wastedMana += vals.waste
		}
	}
	modifyBlood(value) {
		if (value !== 0) {
			if (value > 0) {
				this._totalGainedBlood += value
			} else {
				this._totalSpentBlood += value
			}
			const vals = Resources._bindToCeiling(this._currentBlood, value, this.library.MAX_BLOOD)
			this._currentMana = vals.result
			this._wastedBlood += vals.waste
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

	static _bindToCeiling(op1, op2, ceiling) {
		const waste = op1 + op2 > ceiling ? op1 + op2 - ceiling : 0
		const result = op1 + op2 > ceiling ? ceiling : op1 + op2
		return {waste: waste, result: result}
	}
}
