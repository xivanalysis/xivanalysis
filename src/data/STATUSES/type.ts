export interface Status {
	id: number
	name: string
	icon: string
	duration?: number
}

export const ensureStatus = <T extends Record<string, Status>>(statuses: T): T => statuses
