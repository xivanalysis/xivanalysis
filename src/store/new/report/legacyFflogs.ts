import {ReportStore} from './base'
import {
	reportStore as legacyReportStore,
	Report as LegacyReport,
} from 'store/report'
import {computed} from 'mobx'
import {
	Fight,
	Actor as FflogsActor,
	ActorFightInstance,
	ActorType,
} from 'fflogs'
import {Pull, Actor, Team} from 'report'
import JOBS, {JobType} from 'data/JOBS'
import {languageToEdition} from 'data/PATCHES'
import {getEncounterKey} from 'data/ENCOUNTERS'

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

/**
 * Report source acting as an adapter to the old report store system while we port
 * the rest of the analysis logic across.
 */
export class LegacyFflogsReportStore extends ReportStore {
	@computed
	get report() {
		// If the report hasn't finished loading yet, bail early
		const report = legacyReportStore.report
		if (report?.loading !== false) {
			return
		}

		// Build the full actor structure ahead of time
		const actorsByFight = buildActorsByFight(report)

		return {
			timestamp: report.start,
			edition: languageToEdition(report.lang),

			name: report.title,
			pulls: report.fights.map(
				fight => convertFight(
					report,
					fight,
					actorsByFight.get(fight.id) ?? [],
				),
			),

			meta: {...report, source: 'legacyFflogs' as const},
		}
	}

	async fetchReport(code: string) {
		// Pass through directly to the legacy store. It handles caching for us.
		await legacyReportStore.fetchReportIfNeeded(code)
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

	// TODO: Handle instances and groups
	// TODO: How the _fuck_ am i going to handle instances? dupes?
	function pushToFights(fights: ActorFightInstance[], actor: Actor) {
		fights.forEach(fight => pushToFight(fight.id, actor))
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
	// TODO: Instances?
	id: actor.id.toString(),
	name: actor.name,
	team: Team.UNKNOWN,
	playerControlled: false,
	job: 'UNKNOWN',
	...overrides,
})

const convertFight = (
	report: LegacyReport,
	fight: Fight,
	actors: Actor[],
): Pull => ({
	id: fight.id.toString(),

	timestamp: report.start + fight.start_time,
	duration: fight.end_time - fight.start_time,
	progress: fight.fightPercentage != null
		? 100 - fight.fightPercentage / 100
		: undefined,

	encounter: {
		key: getEncounterKey('legacyFflogs', fight.boss.toString()),
		name: fight.name,
		duty: {
			id: fight.zoneID,
			name: fight.zoneName,
		},
	},

	actors,
})

// Build a mapping between fflogs actor types and our internal job keys
const actorTypeMap = new Map<ActorType, JobType>()
for (const [key, job] of Object.entries(JOBS)) {
	actorTypeMap.set(job.logType, key as JobType)
}
const convertActorType = (actorType: ActorType) =>
	actorTypeMap.get(actorType) ?? 'UNKNOWN'
