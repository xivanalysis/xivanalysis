export default class Requirement {
	name = ''
	_percent = 0

	get percent() {
		const result = (typeof this._percent === 'function')? this._percent() : this._percent
		// Make sure janky output is reverted to a number
		return result || 0
	}
	set percent(value) {
		this._percent = value
		// console.log(value)
	}

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}
}
