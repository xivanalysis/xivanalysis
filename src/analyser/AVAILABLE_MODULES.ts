import {Job} from '@xivanalysis/parser-core'
import CORE from './core'
import SMN from './jobs/smn'
import {Meta} from './Meta'

export {CORE}

export const JOBS: Partial<Record<Job, Meta>> = {
	[Job.SUMMONER]: SMN,
}

export const ZONES: Record<number, Meta> = {
	// [zoneId]: zoneMeta
}
