import math from 'mathjsCustom'
import {RATING_STYLES} from 'components/modules/Checklist'

export default class Rule {
	name = ''
	description = null
	requirements = []
	target = 95
	decentTarget = 95
	showAsInfo = false
	showPercent = true
	_text = null
	_percent = null


	get rating() {
		if (this.showAsInfo) { return RATING_STYLES.info }
		return this.percent >= this.target ? RATING_STYLES.success :
			this.percent >= this.decentTarget ? RATING_STYLES.decent : RATING_STYLES.fail

	}

	//properties
	get percent() {
		//default case: take mean of percentage
		//if this._percent is defined and is a function, evaluate it, if it's defined as a value, take the value
		const percent = this._percent || math.mean(this.requirements.map(requirement => requirement.percent))
		const result = (typeof percent === 'function') ? percent() : percent
		return result || 0
	}

	set percent(value) {
		this._percent = value
	}

	get text() {
		//using && means it renders 'false' if showPercent is false
		const text = (typeof this._text === 'function' ? this._text(this.percent) : this._text) || ''
		return (this.showPercent ? `${this.percent.toFixed(1)}%` : '') + text
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
