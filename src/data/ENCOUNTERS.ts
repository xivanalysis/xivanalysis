import _ from 'lodash'
import {ReportMetaKey} from 'report'
import {ensureRecord} from 'utilities'

export interface Encounter {
	ids?: Partial<Record<ReportMetaKey, string>>
}

// NOTE: Keep documentation at `docs/patch-checklist.md` up to date with
// instructions on how to find encounter IDs for each report source.
export const ENCOUNTERS = ensureRecord<Encounter>()({
	TRASH: {ids: {legacyFflogs: '0'}},
	EX5: {ids: {legacyFflogs: '1067'}},
})

export type EncounterKey = keyof typeof ENCOUNTERS

export const getEncounterKey = (source: ReportMetaKey, id: string) =>
	_.findKey(ENCOUNTERS, encounter => encounter.ids[source] === id) as EncounterKey

// Duties are in this file alongside encounters due to the heavily related nature
// of the data they represent. If this file gets too unweildy, split.

export interface Duty {
	territoryType: number
}

export const DUTIES = ensureRecord<Duty>()({
})

export const getDutyBanner = (territoryType: number) =>
	`https://xivanalysis.com/xivapi/zone-banner/${territoryType}`
