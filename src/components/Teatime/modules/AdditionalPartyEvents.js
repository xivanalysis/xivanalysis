import stable from 'stable'

import {getFflogsEvents} from 'api'
import Module from 'parser/core/Module'
import {isDefined} from 'utilities'

const buildQueryFilter = data => [
	// Player-applied debuffs that don't get pulled when checking by actor
	{
		types: ['applydebuff', 'removedebuff'],
		abilities: [
			data.statuses.TRICK_ATTACK_VULNERABILITY_UP.id,
			data.statuses.CHAIN_STRATAGEM.id,
			data.statuses.RUINATION.id,
			data.statuses.ADDLE.id,
		],
		targetsOnly: true,
	}, {
		types: ['begincast', 'cast'],
		abilities: [
			//Tanks
			data.actions.RAMPART.id,
			data.actions.REPRISAL.id,

			// Melee
			data.actions.FEINT.id,

			// Casters
			data.actions.ADDLE.id,

			// Ranged
			// lol

			//Jobs...
			//DRK
			// Personal
			data.actions.SHADOW_WALL.id,
			data.actions.DARK_MIND.id,
			data.actions.LIVING_DEAD.id,
			// Single
			data.actions.THE_BLACKEST_NIGHT.id,
			// AoE
			data.actions.DARK_MISSIONARY.id,

			//WAR
			// Personal
			data.actions.VENGEANCE.id,
			data.actions.HOLMGANG.id,
			data.actions.THRILL_OF_BATTLE.id,
			data.actions.EQUILIBRIUM.id,
			data.actions.RAW_INTUITION.id,
			// Single
			data.actions.NASCENT_FLASH.id,
			// AoE
			data.actions.SHAKE_IT_OFF.id,

			//SCH
			data.actions.SACRED_SOIL.id,
			data.actions.SCH_FEY_ILLUMINATION.id,
			// pet versions
			data.actions.FEY_ILLUMINATION.id,
			data.actions.SERAPHIC_ILLUMINATION.id,

			//WHM
			data.actions.TEMPERANCE.id,

			//SMN
			//nope

			//BRD
			data.actions.TROUBADOUR.id,
			data.actions.THE_WARDENS_PAEAN.id,

			//NIN
			//nope

			//SAM
			//nope

		],
		targetsOnly: false,
	},
]

const EVENT_TYPE_ORDER = {
	death: -4,
	begincast: -3,
	cast: -2,
	calculateddamage: -1.5,
	calculatedheal: -1.5,
	damage: -1,
	heal: -1,
	default: 0,
	removebuff: 1,
	removebuffstack: 1,
	removedebuff: 1,
	removedebuffstack: 1,
	refreshbuff: 2,
	refreshdebuff: 2,
	applybuff: 3,
	applybuffstack: 3,
	applydebuff: 3,
	applydebuffstack: 3,
}

export default class AdditionalPartyEvents extends Module {
	static handle = 'additionalPartyEvents'
	static dependencies = [
		'enemies',
		'data',
	]

	async normalise(events) {
		// Build a query from the active targets
		const targetQuery = Object.keys(this.enemies.activeTargets)
			.map(actorId => {
				const actor = this.enemies.getEntity(Number(actorId))
				if (!actor) {
					return
				}

				const instances = this.enemies.activeTargets[actorId]
				let query = '(target.id=' + actor.guid
				if (instances.size > 0) {
					query += ` and target.instance in (${Array.from(instances).join(',')})`
				}
				return query + ')'
			})
			.filter(isDefined)
			.join(' or ')

		// Build the filter string
		let filter = buildQueryFilter(this.data).map(section => {
			const types = section.types.map(type => `'${type}'`).join(',')
			const abilities = section.abilities.join(',')

			let condition = `type in (${types}) and ability.id in (${abilities})`
			if (section.targetsOnly) {
				condition += ` and (${targetQuery})`
			}

			return `(${condition})`
		}).join(' or ')

		// Exclude events by the current player and their pets, as we already have them from the main event lookup
		const playerIds = [
			this.parser.player.guid,
			...this.parser.player.pets.map(pet => pet.guid),
		].join(',')
		filter =  `(${filter}) and source.id not in (${playerIds})`

		// Request the new events
		const newEvents = await getFflogsEvents(
			this.parser.report.code,
			this.parser.fight,
			{filter},
		)

		// Add them onto the end, then sort. Using stable to ensure order is kept, as it can be sensitive sometimes.
		events.push(...newEvents)
		stable.inplace(events, (a, b) => {
			if (a.timestamp === b.timestamp) {
				const aTypeOrder = EVENT_TYPE_ORDER[a.type] || EVENT_TYPE_ORDER.default
				const bTypeOrder = EVENT_TYPE_ORDER[b.type] || EVENT_TYPE_ORDER.default
				return aTypeOrder - bTypeOrder
			}
			return a.timestamp - b.timestamp
		})

		return events
	}
}
