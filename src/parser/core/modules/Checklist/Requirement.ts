import {ReactNode} from 'react'

export interface RequirementProps {
	name: ReactNode,
	percent?: number
	value?: number
	target?: number
	weight?: number
	overrideDisplay?: ReactNode
}

export default class Requirement {
	name: ReactNode
	_percent: number | undefined
	value: number | undefined
	target: number = 100
	weight: number
	overrideDisplay: ReactNode

	get content(): ReactNode {
		if (this.overrideDisplay != null) { return this.overrideDisplay }
		if (this._percent != null || this.value == null) { return `${this.percent.toFixed(2)}%` }
		return `${this.value.toFixed(0)}/${this.target.toFixed(0)}` //avoid weird floating point shit
	}
	get percent(): number {
		if (this._percent == null) {
			if (this.value === null) { return 0 }
			return 100 * ((this.value) || 0) / this.target
		}
		return (this._percent) || 0
	}
	set percent(value: number | undefined) {
		this._percent = value
	}

	constructor(props: RequirementProps) {
		this.name = props.name,
		this.percent = props.percent
		this.value = props.value
		this.weight = props.weight ?? 1
		this.target = props.target ?? 100
		this.overrideDisplay = props.overrideDisplay
	}
}
