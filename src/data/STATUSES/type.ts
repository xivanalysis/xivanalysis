import {ensureRecord} from 'utilities'

export interface Status {
	id: number
	name: string
	icon: string
	duration?: number
	stacksApplied?: number
	speedModifier?: number
}

export const ensureStatuses = ensureRecord<Status>()
