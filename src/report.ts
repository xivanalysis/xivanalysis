import {JobType} from 'data/JOBS'
import {GameEdition} from 'data/PATCHES'
import {Compute} from 'utilities'

// tslint:disable-next-line no-empty-interface
export interface ReportMetaRepository {}

type ReportMetaUnion<S extends keyof ReportMetaRepository> =
	S extends any
		? {source: S} & ReportMetaRepository[S]
		: never
export type ReportMeta = Compute<ReportMetaUnion<keyof ReportMetaRepository>>

/**
 * A report contains one or more pulls, across one or more encounters
 */
export interface Report {
	timestamp: number
	edition: GameEdition

	name: string
	pulls: Pull[]

	meta?: ReportMeta
}

/** A pull is a single attempt at clearing an encounter */
export interface Pull {
	id: string

	timestamp: number
	duration: number

	encounter: Encounter

	/** One or more actors are involved in each pull */
	actors: Actor[]
}

/** Each encounter takes place within a duty */
export interface Encounter {
	// TODO: work out a generic way to ID encounters.
	// There's a bunch of stuff (such as the boss module system) that explicitly relies on FFLogs' boss IDs.
	name: string
	duty: Duty
}

/** */
export interface Duty {
	// TODO: Handle trash. -1?
	/** ID of the duty. This should match an ID from the TerritoryType game table. */
	id: number
	name: string
}

/** All actors belong to a team, which defines their relationship with other actors */
export enum Team {
	UNKNOWN,
	FRIEND,
	FOE,
}

/** An actor represents a single combatant within a pull */
export interface Actor {
	id: string
	name: string
	team: Team
	playerControlled: boolean
	owner?: Actor
	job: JobType
}
