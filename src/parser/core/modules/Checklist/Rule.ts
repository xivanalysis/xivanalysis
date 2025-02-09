import {DisplayOrder} from 'parser/core/Analyser'
import {ReactNode} from 'react'
import {Requirement} from './Requirement'

export const TARGET = {
	SUCCESS: 2,
	WARN: 1,
	FAIL: undefined,
}

const DEFAULT_TARGET = 95

export interface RuleProps {
	name: ReactNode,
	description: ReactNode,
	requirements: Requirement[],
	target?: number,
	displayOrder?: number,
}

export class Rule {
	name: ReactNode
	description: ReactNode
	requirements: Requirement[]
	target: number
	displayOrder: number

	get passed(): boolean {
		return this.percent >= this.target
	}

	get percent() {
		const weightedPercents = this.requirements.reduce((aggregate, requirement) => aggregate + requirement.percent * requirement.weight, 0)
		const totalWeight = this.requirements.reduce((aggregate, requirement) => aggregate + requirement.weight, 0)
		return totalWeight !== 0 ? weightedPercents / totalWeight : 0
	}

	constructor(props: RuleProps) {
		this.name = props.name
		this.description = props.description
		this.requirements = props.requirements
		this.target = props.target ?? DEFAULT_TARGET
		this.displayOrder = props.displayOrder ?? DisplayOrder.DEFAULT
	}
}
