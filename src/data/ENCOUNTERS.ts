import _ from 'lodash'
import {ReportMetaKey} from 'report'

export interface Encounter {
	ids?: Partial<Record<ReportMetaKey, string>>
}

const ensureEncounters = <T extends Record<string, Encounter>>(encounters: T): {[K in keyof T]: T[K] & Encounter} => encounters

export const ENCOUNTERS = ensureEncounters({
	TRASH: {ids: {legacyFflogs: '0'}},
})

export type EncounterKey = keyof typeof ENCOUNTERS

export const getEncounterKey = (source: ReportMetaKey, id: string) =>
	_.findKey(ENCOUNTERS, encounter => encounter.ids[source] === id) as EncounterKey

// Duties are in this file alongside encounters due to the heavily related nature
// of the data they represent. If this file gets too unweildy, split.

export interface Duty {
	territoryType: number
}

const ensureDuties = <T extends Record<string, Duty>>(duties: T): {[K in keyof T]: T[K] & Duty} => duties

export const DUTIES = ensureDuties({
})

export const getDutyBanner = (territoryType: number) =>
	`https://xivanalysis.com/xivapi/zone-banner/${territoryType}`
