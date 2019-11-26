export interface Status {
	id: number
	name: string
	icon: string
	duration?: number
}

export const ensureStatuses = <T extends Record<string, Status>>(statuses: T): T => statuses
