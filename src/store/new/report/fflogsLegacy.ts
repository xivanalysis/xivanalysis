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
} from 'fflogs'
import {Pull, Actor, Team} from './types'

export class FflogsLegacyReportStore extends ReportStore {
	@computed
	get report() {
		const report = legacyReportStore.report
		if (report?.loading !== false) {
			return
		}

		const actorsByFight = this.buildActorsByFight(report)

		return {
			name: report.title,
			pulls: report.fights.map(
				fight => this.convertFight(fight, actorsByFight.get(fight.id) ?? []),
			),

			// TODO: remove
			meta: report,
		}
	}

	async fetchReport(code: string) {
		await legacyReportStore.fetchReportIfNeeded(code)
	}

	private buildActorsByFight(report: LegacyReport) {
		// TODO: string id?
		const actors = new Map<number, Actor>()
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
				// TODO: this should use actor.id once i add the fucking thing
				actors.set(fflogsActor.id, actor)
				pushToFights(fflogsActor.fights, actor)
			})
		}

		buildActors(report.friendlies, friendly => this.convertActor(friendly, {
			team: Team.FRIEND,
			playerControlled: true,
		}))

		buildActors(report.enemies, enemy => this.convertActor(enemy, {team: Team.FOE}))

		buildActors(report.friendlyPets, friendlyPet => this.convertActor(friendlyPet, {
			team: Team.FRIEND,
			owner: actors.get(friendlyPet.petOwner),
		}))

		buildActors(report.enemyPets, enemyPet => this.convertActor(enemyPet, {
			team: Team.FOE,
			owner: actors.get(enemyPet.petOwner),
		}))

		return actorsByFight
	}

	private convertActor = (actor: FflogsActor, overrides?: Partial<Actor>): Actor => ({
		name: actor.name,
		team: Team.UNKNOWN,
		playerControlled: false,
		...overrides,
	})

	private convertFight = (fight: Fight, actors: Actor[]): Pull => ({
		encounter: {
			name: fight.name,
			duty: {
				name: fight.zoneName,
			},
		},
		actors,
	})
}
