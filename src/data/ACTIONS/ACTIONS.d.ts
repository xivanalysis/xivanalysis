import {Status} from 'data/STATUSES/STATUSES'

interface ActionCombo {
	start?: boolean
	from?: number
	end?: boolean
}

export interface Action {
	id: number
	name: string
	icon: string
	onGcd?: boolean
	breaksCombo?: boolean
	combo?: ActionCombo
	castTime?: number
	cooldown?: number
	autoAttack?: boolean
	statusesApplied?: Status[]
	[key: string]: unknown
}
