/**
 * A report contains one or more pulls, across one or more encounters
 */
export interface Report {
	name: string
	pulls: Pull[]
}

/** A pull is a single attempt at clearing an encounter */
export interface Pull {
	encounter: Encounter

	/** One or more actors are involved in each pull */
	actors: Actor[]
}

/** Each encounter takes place within a duty */
export interface Encounter {
	name: string
	duty: Duty
}

/** */
export interface Duty {
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
