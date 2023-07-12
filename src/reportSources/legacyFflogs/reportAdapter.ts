import {GameEdition} from 'data/EDITIONS'
import {getEncounterKey} from 'data/ENCOUNTERS'
import {JobKey} from 'data/JOBS'
import {toJS} from 'mobx'
import {Actor, Pull, Report, Team} from 'report'
import {resolveActorId} from './base'
import {ActorType, Actor as FflogsActor, Fight, ActorFightInstance, ReportLanguage} from './eventTypes'
import {Report as LegacyReport} from './legacyStore'

// Some actor types represent NPCs, but show up in the otherwise player-controlled "friendlies" array.
const NPC_FRIENDLY_TYPES: ActorType[] = [
	ActorType.NPC,
	ActorType.LIMIT_BREAK,
]

// Some actors are ephemeral / not used in combat, and as such do not have a
// stable GUID. FFLogs seperates these by numberspacing them above a multiple
// of this value.
const UNSTABLE_GUID_MINIMUM = 1000000

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
					: {...actor, id: resolveActorId({id: actor.id, instance})}
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
	id: resolveActorId({id: actor.id}),
	kind: resolveActorKind(actor.id, actor.guid),
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

function resolveActorKind(id: number, guid: number) {
	// Unstable GUIDs will reliably match their ID with a numberspace.
	// Because these GUIDs are unstable between logs, and used (seemingly)
	// exclusively for mechanic-actors that can't be targeted, we're eagerly
	// falling them back to `unknown`.
	if (guid >= UNSTABLE_GUID_MINIMUM && id === guid % UNSTABLE_GUID_MINIMUM) {
		return 'unknown'
	}

	return guid.toString()
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
const actorTypeMap = new Map<ActorType, JobKey>([
	[ActorType.UNKNOWN, 'UNKNOWN'],
	[ActorType.PALADIN, 'PALADIN'],
	[ActorType.WARRIOR, 'WARRIOR'],
	[ActorType.DARK_KNIGHT, 'DARK_KNIGHT'],
	[ActorType.GUNBREAKER, 'GUNBREAKER'],
	[ActorType.WHITE_MAGE, 'WHITE_MAGE'],
	[ActorType.SCHOLAR, 'SCHOLAR'],
	[ActorType.ASTROLOGIAN, 'ASTROLOGIAN'],
	[ActorType.SAGE, 'SAGE'],
	[ActorType.MONK, 'MONK'],
	[ActorType.DRAGOON, 'DRAGOON'],
	[ActorType.NINJA, 'NINJA'],
	[ActorType.SAMURAI, 'SAMURAI'],
	[ActorType.REAPER, 'REAPER'],
	[ActorType.BARD, 'BARD'],
	[ActorType.MACHINIST, 'MACHINIST'],
	[ActorType.DANCER, 'DANCER'],
	[ActorType.BLACK_MAGE, 'BLACK_MAGE'],
	[ActorType.SUMMONER, 'SUMMONER'],
	[ActorType.RED_MAGE, 'RED_MAGE'],
	[ActorType.BLUE_MAGE, 'BLUE_MAGE'],
])
const convertActorType = (actorType: ActorType) =>
	actorTypeMap.get(actorType) ?? 'UNKNOWN'

function languageToEdition(lang: ReportLanguage): GameEdition {
	switch (lang) {
	case ReportLanguage.JAPANESE:
	case ReportLanguage.ENGLISH:
	case ReportLanguage.GERMAN:
	case ReportLanguage.FRENCH:
		return GameEdition.GLOBAL

	case ReportLanguage.KOREAN:
		return GameEdition.KOREAN

	case ReportLanguage.CHINESE:
		return GameEdition.CHINESE

		// Fallback case for when fflogs borks
		// TODO: This probably will crop up in other places. Look into solving it higher up the chain.
	case ReportLanguage.UNKNOWN:
	case undefined:
		return GameEdition.GLOBAL
	}

	throw new Error(`Unknown report language "${lang}" received.`)
}
