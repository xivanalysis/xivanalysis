import {languageToEdition} from 'data/EDITIONS'
import {getEncounterKey} from 'data/ENCOUNTERS'
import JOBS, {JobKey} from 'data/JOBS'
import {ActorType, Actor as FflogsActor, Fight, ActorFightInstance} from 'fflogs'
import {toJS} from 'mobx'
import {Actor, Pull, Report, Team} from 'report'
import {Report as LegacyReport} from 'store/report'

// Some actor types represent NPCs, but show up in the otherwise player-controlled "friendlies" array.
const NPC_FRIENDLY_TYPES: ActorType[] = [
	ActorType.NPC,
	ActorType.LIMIT_BREAK,
]

// We're storing the entire legacy report interface in the meta field so that
// we can pull it back out again for the legacy analysis page, while it gets upgraded
// to work with the new system.
declare module 'report' {
	interface ReportMetaRepository {
		legacyFflogs: LegacyReport
	}
}

export function adaptReport(report: LegacyReport): Report {
	// Build the full actor structure ahead of time
	const actorsByFight = buildActorsByFight(report)

	return {
		timestamp: report.start,
		edition: languageToEdition(report.lang),

		name: report.title,
		pulls: report.fights.map(
			fight => convertFight(report, fight, actorsByFight.get(fight.id) ?? []),
		),

		meta: {...toJS(report), source: 'legacyFflogs' as const},
	}
}

function buildActorsByFight(report: LegacyReport) {
	const actors = new Map<FflogsActor['id'], Actor>()
	const actorsByFight = new Map<Fight['id'], Actor[]>()

	function pushToFight(fightId: Fight['id'], actor: Actor) {
		let actors = actorsByFight.get(fightId)
		if (actors == null) {
			actors = []
			actorsByFight.set(fightId, actors)
		}
		actors.push(actor)
	}

	// TODO: Do we need to handle groups, or can we assume that's an fflogs UI concern we can ignore?
	function pushToFights(fights: ActorFightInstance[], actor: Actor) {
		fights.forEach(fight => {
			// Add copies of the actor for each seperate "instance" in the fight
			// TODO: Should I bother preserving instances across multiple fights or nah?
			const instances = fight.instances ?? 1
			for (let instance = 1; instance <= instances; instance++) {
				const instanceActor: Actor = instance === 1
					? actor
					: {...actor, id: `${actor.id}:${instance}`}
				pushToFight(fight.id, instanceActor)
			}
		})
	}

	function buildActors<A extends FflogsActor>(
		fflogsActors: A[],
		convert: (fflogsActor: A) => Actor,
	) {
		fflogsActors.forEach(fflogsActor => {
			const actor = convert(fflogsActor)
			actors.set(fflogsActor.id, actor)
			pushToFights(fflogsActor.fights, actor)
		})
	}

	buildActors(report.friendlies, friendly => convertActor(friendly, {
		team: Team.FRIEND,
		playerControlled: !NPC_FRIENDLY_TYPES.includes(friendly.type),
		job: convertActorType(friendly.type),
	}))

	buildActors(report.enemies, enemy => convertActor(enemy, {team: Team.FOE}))

	buildActors(report.friendlyPets, friendlyPet => convertActor(friendlyPet, {
		team: Team.FRIEND,
		owner: actors.get(friendlyPet.petOwner),
	}))

	buildActors(report.enemyPets, enemyPet => convertActor(enemyPet, {
		team: Team.FOE,
		owner: actors.get(enemyPet.petOwner),
	}))

	return actorsByFight
}

const convertActor = (actor: FflogsActor, overrides?: Partial<Actor>): Actor => ({
	...UNKNOWN_ACTOR,
	id: actor.id.toString(),
	kind: actor.guid.toString(),
	name: actor.name,
	...overrides,
})

const UNKNOWN_ACTOR: Actor = {
	id: 'unknown',
	kind: 'unknown',
	name: 'Unknown',
	team: Team.UNKNOWN,
	playerControlled: false,
	job: 'UNKNOWN',
}

const convertFight = (
	report: LegacyReport,
	fight: Fight,
	actors: Actor[],
): Pull => ({
	id: fight.id.toString(),

	timestamp: report.start + fight.start_time,
	duration: fight.end_time - fight.start_time,
	progress: getFightProgress(fight),

	encounter: {
		key: getEncounterKey('legacyFflogs', fight.boss.toString()),
		name: fight.name,
		duty: {
			id: fight.zoneID,
			name: fight.zoneName,
		},
	},

	actors: [...actors, UNKNOWN_ACTOR],
})

function getFightProgress(fight: Fight) {
	// Always mark kills as 100% progress
	if (fight.kill) {
		return 100
	}

	if (fight.fightPercentage == null) {
		return
	}

	return 100 - fight.fightPercentage / 100
}

// Build a mapping between fflogs actor types and our internal job keys
const actorTypeMap = new Map<ActorType, JobKey>()
for (const [key, job] of Object.entries(JOBS)) {
	actorTypeMap.set(job.logType, key as JobKey)
}
const convertActorType = (actorType: ActorType) =>
	actorTypeMap.get(actorType) ?? 'UNKNOWN'
