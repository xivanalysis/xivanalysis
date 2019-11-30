export default class Requirement {
	name = ''
	_percent = null
	value = null
	target = 100
	overrideDisplay = null

	get content() {
		if (this.overrideDisplay !== null) { return this.overrideDisplay }
		if (this._percent !== null || this.value === null) { return `${this.percent.toFixed(2)}%` }
		return `${this.value.toFixed(0)}/${this.target.toFixed(0)}` //avoid weird floating point shit
	}
	get percent() {
		if (this._percent === null) {
			if (this.value === null) { return 0 }
			return 100 * (((typeof this.value === 'function')? this.value() : this.value) || 0) / this.target
		}
		return ((typeof this._percent === 'function')? this._percent() : this._percent) || 0
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
