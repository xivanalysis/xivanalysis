import Module from 'parser/core/Module'

export default class Resources extends Module {
	static handle = 'resources'
	static title = 'Resources'
	static dependencies = [
		'library',
		'suggestions',
	]

	constructor(...args) {
		super(...args)
		// this.addHook('init', this._onInit)
		this.addHook('complete', this._onComplete)
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
	modifyMana(value) {
		const vals = Resources._bindToCeiling(this._currentMana, value, this.library.MAX_MANA)
		this._currentMana = vals.result
		this._wastedMana += vals.waste
	}
	modifyBlood(value) {
		const vals = Resources._bindToCeiling(this._currentBlood, value, this.library.MAX_BLOOD)
		this._currentMana = vals.result
		this._wastedBlood += vals.waste
	}
	// -----
	// Internals
	// -----
	_currentMana = this.library.MAX_MANA
	_wastedMana = 0
	_wastedManaInstances = []
	_currentBlood = 0
	_wastedBlood = 0
	_wastedBloodInstances = []
	//
	static _bindToCeiling(op1, op2, ceiling) {
		const waste = op1 + op2 > ceiling ? op1 + op2 - ceiling : 0
		const result = op1 + op2 > ceiling ? ceiling : op1 + op2
		return {waste: waste, result: result}
	}

	_onComplete() {
		// graph mana and blood capping
		// flag negative mana points on debug
	}
}
