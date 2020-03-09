import {SortEvents} from 'parser/core/EventSorting'
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
		],
		targetsOnly: true,
	},
	//Section for non-status based enemy events
	{
		types: ['targetabilityupdate'],
		targetsOnly: true,
	},
]

export default class AdditionalEvents extends Module {
	static handle = 'additionalEvents'
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
			let condition = `type in (${types})`
			if (section.abilities) {
				const abilities = section.abilities.join(',')
				condition += ` and ability.id in (${abilities})`
			}
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

		return SortEvents(events)
	}
}
