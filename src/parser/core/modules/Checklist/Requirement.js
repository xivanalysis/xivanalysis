export default class Requirement {
	name = ''
	_percent = 0
	_score = null

	get score() {
		if (this._score == null) { return this.percent }
		const result = (typeof this._score === 'function') ? this._score() : this._score
		// Make sure janky output is reverted to a number
		return result || 0
	}

	set score(value) {
		this._score = value
	}

	get percent() {
		const result = (typeof this._percent === 'function') ? this._percent() : this._percent
		// Make sure janky output is reverted to a number
		return result || 0
	}
	set percent(value) {
		this._percent = value
	}

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}
}
