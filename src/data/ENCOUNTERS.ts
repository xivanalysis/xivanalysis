import {ReportSource} from 'report'

export interface Encounter {
	ids?: Partial<Record<ReportSource, string>>
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

export function getEncounterKey(source: ReportSource, id: string) {
	for (const [key, encounter] of Object.entries(ENCOUNTERS)) {
		if (encounter.ids[source] === id) {
			return key as EncounterKey
		}
	}
}

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
