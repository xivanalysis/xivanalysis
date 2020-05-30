/**
 * A report contains one or more pulls, across one or more encounters
 */
export interface Report {
	name: string
	pulls: Pull[]
}

/** A pull is a single attempt at clearing an encounter */
export interface Pull {
	id: string
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
	name: string
	team: Team
	playerControlled: boolean
	owner?: Actor
}
