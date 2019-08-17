import stable from 'stable'

import {getFflogsEvents} from 'api'
import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'
import {isDefined} from 'utilities'

const QUERY_FILTER = [
	// Player-applied debuffs that don't get pulled when checking by actor
	{
		types: ['applydebuff', 'removedebuff'],
		abilities: [
			STATUSES.TRICK_ATTACK_VULNERABILITY_UP.id,
			STATUSES.CHAIN_STRATAGEM.id,
			STATUSES.RUINATION.id,
		],
		targetsOnly: true,
	},
]

const EVENT_TYPE_ORDER = {
	death: -4,
	begincast: -3,
	cast: -2,
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

export default class AdditionalEvents extends Module {
	static handle = 'additionalEvents'
	static dependencies = [
		'enemies',
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
		let filter = QUERY_FILTER.map(section => {
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
			{filter}
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
