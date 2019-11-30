export interface Status {
	id: number
	name: string
	icon: string
	duration?: number
	stacksApplied?: number
}

export const ensureStatuses = <T extends Record<string, Status>>(statuses: T): {[K in keyof T]: T[K] & Status} => statuses
