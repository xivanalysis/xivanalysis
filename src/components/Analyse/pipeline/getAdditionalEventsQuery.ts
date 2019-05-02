import STATUSES from 'data/STATUSES'

interface QueryPart {
	types: string[]
	abilities: number[]
	targetsOnly?: boolean
}

// mhm.
const FFLOGS_STATUS_OFFSET = 1000000

const QUERY_FILTER: QueryPart[] = [
	// Need to get RR info to determine card strength
	{
		types: ['removebuff'],
		abilities: [
			FFLOGS_STATUS_OFFSET + STATUSES.ENHANCED_ROYAL_ROAD.id,
			FFLOGS_STATUS_OFFSET + STATUSES.EXPANDED_ROYAL_ROAD.id,
			FFLOGS_STATUS_OFFSET + STATUSES.EXTENDED_ROYAL_ROAD.id,
		],
	},

	// Player-applied debuffs that don't get pulled when checking by actor
	{
		types: ['applydebuff', 'removedebuff'],
		abilities: [
			FFLOGS_STATUS_OFFSET + STATUSES.SLASHING_RESISTANCE_DOWN.id,
			FFLOGS_STATUS_OFFSET + STATUSES.PIERCING_RESISTANCE_DOWN.id,
			FFLOGS_STATUS_OFFSET + STATUSES.BLUNT_RESISTANCE_DOWN.id,
			FFLOGS_STATUS_OFFSET + STATUSES.TRICK_ATTACK_VULNERABILITY_UP.id,
			FFLOGS_STATUS_OFFSET + STATUSES.CHAIN_STRATAGEM.id,
			FFLOGS_STATUS_OFFSET + STATUSES.FOE_REQUIEM_DEBUFF.id,
			FFLOGS_STATUS_OFFSET + STATUSES.HYPERCHARGE_VULNERABILITY_UP.id,
			FFLOGS_STATUS_OFFSET + STATUSES.RADIANT_SHIELD_PHYSICAL_VULNERABILITY_UP.id,
			FFLOGS_STATUS_OFFSET + STATUSES.CONTAGION_MAGIC_VULNERABILITY_UP.id,
			FFLOGS_STATUS_OFFSET + STATUSES.RUINATION.id,
		],
		targetsOnly: true,
	},
]

export function getAdditionalEventsQuery(
	activeTargets: Map<number, Set<number>>,
	ignoreTargets: number[],
) {
	// Build a query from the active targets
	const targetQuery = Array.from(activeTargets).map(([actor, instances]) => {
		let query = '(target.id=' + actor
		if (instances.size > 0) {
			query += ` and target.instance in (${Array.from(instances).join(',')})`
		}
		return query + ')'
	}).join(' or ')

	// Build the filter string
	const filter = QUERY_FILTER.map(section => {
		const types = section.types.map(type => `'${type}'`).join(',')
		const abilities = section.abilities.join(',')

		let condition = `type in (${types}) and ability.id in (${abilities})`
		if (section.targetsOnly) {
			condition += ` and (${targetQuery})`
		}

		return `(${condition})`
	}).join(' or ')

	// Exclude events by the current player and their pets, as we already have them from the main event lookup
	const ignore = ignoreTargets.join(',')
	return `(${filter}) and source.id not in (${ignore})`
}
