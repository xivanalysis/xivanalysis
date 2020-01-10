import _ from 'lodash'
import stable from 'stable'

import {getFflogsEvents} from 'api'
import Module from 'parser/core/Module'
import {isDefined} from 'utilities'
import {JOB_COOLDOWNS} from './PartyCooldowns'

const buildQueryFilter = (data, playerActions) => [
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
		abilities: playerActions,
		targetsOnly: false,
	}, {
		types: ['damage'], // This is probably double grabbing damage for one player
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
		'friendlies',
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

		const playerActions = this.friendlies.playerFriendlies.flatMap(player => (
			JOB_COOLDOWNS[player.type].actions
		))

		// Build the filter string
		let filter = buildQueryFilter(this.data, playerActions).map(section => {
			const types = section.types.map(type => `'${type}'`).join(',')

			let condition = `type in (${types})`
			if (!_.isNil(section.abilities)) {
				const abilities = section.abilities.join(',')
				condition += `and ability.id in (${abilities})`
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
