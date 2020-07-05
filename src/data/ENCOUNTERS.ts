import {ReportMetaKey} from 'report'
import _ from 'lodash'

export interface Encounter {
	ids?: Partial<Record<ReportMetaKey, string>>
}

const ensureEncounters = <T extends Record<string, Encounter>>(encounters: T): {[K in keyof T]: T[K] & Encounter} => encounters

export const ENCOUNTERS = ensureEncounters({
	TRASH: {ids: {legacyFflogs: '0'}},

	// 24mans
	NIER1: {ids: {legacyFflogs: '2020'}},
	NIER2: {ids: {legacyFflogs: '2021'}},
	NIER3: {ids: {legacyFflogs: '2022'}},
	NIER4: {ids: {legacyFflogs: '2023'}},

	// Trials
	EX_RUBY_1: {ids: {legacyFflogs: '1051'}},
	EX_RUBY_2: {ids: {legacyFflogs: '1052'}},
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
	// Trials
	EX_TITANIA: {territoryType: 858},
	EX_INNOCENCE: {territoryType: 848},
	EX_HADES: {territoryType: 885},
	EX_VARIS: {territoryType: 913},

	// Raids
	E1S: {territoryType: 853},
	E2S: {territoryType: 854},
	E3S: {territoryType: 855},
	E4S: {territoryType: 856},
	E5S: {territoryType: 906},
	E6S: {territoryType: 907},
	E7S: {territoryType: 908},
	E8S: {territoryType: 909},

	// Ultimates
	TEA: {territoryType: 887},
})

export const getDutyBanner = (territoryType: number) =>
	`https://xivanalysis.com/xivapi/zone-banner/${territoryType}`
