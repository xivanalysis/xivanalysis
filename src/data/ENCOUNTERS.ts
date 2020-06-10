import {ReportSource} from 'report'

export interface Encounter {
	ids?: Partial<Record<ReportSource, string>>
}

const ensureEncounters = <T extends Record<string, Encounter>>(encounters: T): {[K in keyof T]: T[K] & Encounter} => encounters

export const ENCOUNTERS = ensureEncounters({
	TRASH: {ids: {legacyFflogs: '0'}},

	NIER1: {ids: {legacyFflogs: '2020'}},
})

export type EncounterKey = keyof typeof ENCOUNTERS

export function getEncounter(source: ReportSource, id: string) {
	for (const [key, encounter] of Object.entries(ENCOUNTERS)) {
		if (encounter.ids[source] === id) {
			return key as EncounterKey
		}
	}
}

/*
encounter {
	key?: keyof encounters
	duty: duty
}

duty {
	id: territype id
}

boss module meta = available[encounter.key] ?? available[duty.id]
*/

export interface Duty {
	territoryType: number
}

const ensureDuties = <T extends Record<string, Duty>>(duties: T): {[K in keyof T]: T[K] & Duty} => duties

export const DUTIES = ensureDuties({
	E6: {territoryType: 907},
})
