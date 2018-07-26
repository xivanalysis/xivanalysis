import math from 'mathjsCustom'

export default class Rule {
	name = ''
	description = null
	requirements = []
	target = 95

	//aggregator functions for percentage and score
	percentAggregator = math.mean
	scoreAggregator = math.mean

	//these are lambdas so you can conveniently override them in your module, while keeping the whole thing compatible :blobmorning:
	_progress = (rule) => {
		return rule.percent
	}
	_display = (rule) => {
		return `${rule.percent.toFixed(1)}%`
	}
	_success = (rule) => {
		return rule.percent >= rule.target
	}
	_reqDisplay = (req) => {
		return `${req.percent.toFixed(2)}%`
	}

	//properties
	get percent() {
		//default case is mean if the function is broken
		if (this.percentAggregator != null && typeof this.percentAggregator == 'function') {
			return this.percentAggregator(this.requirements.map(requirement => requirement.percent))
		}
		return math.mean(this.requirements.map(requirement => requirement.percent))
	}

	get score() {
		//default case is mean if the function is broken
		if (this.scoreAggregator != null && typeof this.scoreAggregator == 'function') {
			return this.scoreAggregator(this.requirements.map(requirement => requirement.score))
		}
		return math.mean(this.requirements.map(requirement => requirement.score))
	}

	get display() {
		return this._display(this)
	}
	set display(value) {
		this._display = value
	}

	get progress() {
		return this._progress(this)
	}
	set progress(value) {
		this._progress = value
	}

	get success() {
		return this._success(this)
	}
	set success(value) {
		this._success = value
	}

	//requirement display is defined here because the checklist can't grant access to members of requirement
	//cannot make this one a property since it needs an argument
	reqDisplay(req) {
		return this._reqDisplay(req)
	}
	//but you can set it of course :)
	set requirementDisplay(value) {
		this._reqDisplay = value
	}

	constructor(options) {
		Object.keys(options || {}).forEach(key => {
			this[key] = options[key]
		})
	}
}
