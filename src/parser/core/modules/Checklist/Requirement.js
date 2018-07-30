export default class Requirement {
	name = ''
	_percent = 0
	_text = null
	_showPercent = true

	get percent() {
		const result = (typeof this._percent === 'function') ? this._percent() : this._percent
		// Make sure janky output is reverted to a number
		return result || 0
	}
	set percent(value) {
		this._percent = value
	}

	get showPercent() {
		return this._showPercent || true
	}
	set showPercent(value) {
		this._showPercent = value
	}

	get percentText() {
		return this.showPercent ? `${this.percent.toFixed(2)}%`: ''
	}
	get text() {
		return (typeof this._text === 'function' ? this._text(this.percent) : this._text) || ''
	}
	set text(value) {
		this._text = value
	}

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}
}
