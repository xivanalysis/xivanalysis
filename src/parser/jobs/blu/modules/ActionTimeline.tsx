import {ActionRow, ActionTimeline as CoreActionTimeline} from 'parser/core/modules/ActionTimeline'

export class ActionTimeline extends CoreActionTimeline {
	static override rows: ActionRow[] = [
		...CoreActionTimeline.rows,
		'NIGHTBLOOM',
		'TRIPLE_TRIDENT',
		{
			lateResolveLabel: true,
			content: ['THE_ROSE_OF_DESTRUCTION', 'CHELONIAN_GATE'],
		},
		{
			lateResolveLabel: true,
			content: ['SHOCK_STRIKE', 'BLU_MOUNTAIN_BUSTER'],
		},
		'GLASS_DANCE',
		'SURPANAKHA',
		{
			lateResolveLabel: true,
			content: ['MATRA_MAGIC', 'DRAGON_FORCE', 'ANGELS_SNACK'],
		},
		{
			lateResolveLabel: true,
			content: ['FEATHER_RAIN', 'ERUPTION'],
		},
		{
			lateResolveLabel: true,
			content: ['PHANTOM_FLURRY', 'PHANTOM_FLURRY_KICK'],
		},
		{
			lateResolveLabel: true,
			content: ['QUASAR', 'J_KICK'],
		},
		{
			label: 'Raid Buffs',
			content: [
				'PECULIAR_LIGHT',
				'OFF_GUARD',
			],
		},
		'COLD_FOG',

		// Standard role actions
		'LUCID_DREAMING',
		'SWIFTCAST',

		// Mit
		'ADDLE',
		'MAGIC_HAMMER',

		// Ressurect
		'ANGEL_WHISPER',

		// Tanking CDs
		'DEVOUR',
	]
}
