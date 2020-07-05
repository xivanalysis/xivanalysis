import {EncounterKey} from 'data/ENCOUNTERS'
import {JobKey} from 'data/JOBS'
import {GameEdition} from 'data/PATCHES'
import {Compute} from 'utilities'

/** Declaration merge target for report meta types. */
// tslint:disable-next-line no-empty-interface
export interface ReportMetaRepository {}

/**
 * Translates `{foo: Foo, bar: Bar}` into
 * `({source: 'foo'} & Foo) | ({source: 'bar'} & Bar)`
 */
type ReportMetaUnion<S extends keyof ReportMetaRepository> =
	S extends any
		? {source: S} & ReportMetaRepository[S]
		: never

/** Union of valid report meta shapes. */
export type ReportMeta = Compute<ReportMetaUnion<keyof ReportMetaRepository>>

/** Union of registered report sources. */
export type ReportMetaKey = keyof ReportMetaRepository

/**
 * Type representation of a report. Reports provide metadata for a session of
 * logged data, i.e. an FFLogs report or an ACT log file.
 */
export interface Report {
	/** Unix timestamp (ms) of the start of the report. */
	timestamp: number
	/** The edition of the game being played during the report. */
	edition: GameEdition

	/** Arbitrary string representing the report in some manner. */
	name: string

	/** Array of pulls that were logged as part of the report. */
	pulls: Pull[]

	/** Metadata specific to the source this report was retrieved from. */
	meta: ReportMeta
}

/**
 * Representation of a pull. A pull is a single attempt at clearing an
 * encounter within the game, be it trash or a boss.
 */
export interface Pull {
	/**
	 * String representation of the pull's ID.
	 * Treat as a black box outside of report source implementations.
	 */
	id: string

	/** Unix timestamp (ms) of the start of the pull. */
	timestamp: number
	/** Duration of the pull (ms). */
	duration: number
	/**
	 * Progress through the fight at end of log, as a percentage (0-100).
	 * If undefined, progress was indeterminate.
	 */
	progress?: number

	/** The encounter the pull was an attempt at clearing. */
	encounter: Encounter

	/** Array of actors that took part in the pull. */
	actors: Actor[]
}

/**
 * Representation of an encounter. Each encounter should be a discrete unit of combat,
 * i.e. a trial boss fight, or the trash between bosses in a dungeon.
 */
export interface Encounter {
	/** Key of ENCOUNTERS for use as a stable reference and internal metadata representation. */
	key?: EncounterKey

	/**
	 * Name of the encounter. Note that, especially for trials, the name of the encounter
	 * is _not_ the name of the duty.
	 */
	name: string
	/** Duty the encounter takes place within. */
	duty: Duty
}

/** Representation of a duty. Duties should align with those defined by the game. */
export interface Duty {
	/** ID of the duty. This should match an ID from the TerritoryType game table. */
	id: number
	/**
	 * Name of the duty. Note that this should be the name of the duty, not the name
	 * of the map the duty takes place within.
	 */
	name: string
}

/** Teams are a representation of the combat relationship between two or more actors. */
export enum Team {
	UNKNOWN,
	FRIEND,
	FOE,
}

/**
 * An actor represents a single discrete combatant within a pull. In the case of
 * multiple identical entities (i.e. "adds"), each should be a discrete actor.
 */
export interface Actor {
	/**
	 * String representation of the actor's ID.
	 * Treat as a black box outside report sources.
	 */
	id: string
	/** Name of the actor. */
	name: string
	/** Team the actor belongs to, in relation to the logging user. */
	team: Team
	/**
	 * Whether the actor is directly controlled by the player.
	 * This is _not_ inclusive of player pets.
	 */
	playerControlled: boolean
	/** Actor that controls this actor, if applicable. i.e. player pets. */
	owner?: Actor
	/** Combat job of the actor. */
	job: JobKey
}
