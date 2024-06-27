import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions} from '../type'

export const WHM = ensureActions({
	LITURGY_OF_THE_BELL_ACTIVATION: {
		id: 28509,
		name: 'Liturgy of the Bell (Detonate)',
		icon: 'https://xivapi.com/i/002000/002649.png',
		cooldown: 1000,
	},
	LITURGY_OF_THE_BELL_ON_EXPIRY: {
		id: 25864,
		name: 'Liturgy of the Bell',
		icon: iconUrl(2649),
	},

	LITURGY_OF_THE_BELL_ON_DAMAGE: {
		id: 25863,
		name: 'Liturgy of the Bell',
		icon: iconUrl(2649),
	},

	LITURGY_OF_THE_BELL: {
		id: 25862,
		name: 'Liturgy of the Bell',
		icon: iconUrl(2649),
		cooldown: 180000,
		statusesApplied: ['LITURGY_OF_THE_BELL'],
	},

	AQUAVEIL: {
		id: 25861,
		name: 'Aquaveil',
		icon: iconUrl(2648),
		cooldown: 60000,
		statusesApplied: ['AQUAVEIL'],
	},

	HOLY_III: {
		id: 25860,
		name: 'Holy III',
		icon: iconUrl(2647),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 400,
	},

	GLARE_III: {
		id: 25859,
		name: 'Glare III',
		icon: iconUrl(2646),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	TEMPERANCE: {
		id: 16536,
		name: 'Temperance',
		icon: iconUrl(2645),
		cooldown: 120000,
		statusesApplied: ['TEMPERANCE'],
	},

	AFFLATUS_MISERY: {
		id: 16535,
		name: 'Afflatus Misery',
		icon: iconUrl(2644),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	AFFLATUS_RAPTURE: {
		id: 16534,
		name: 'Afflatus Rapture',
		icon: iconUrl(2643),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	AFFLATUS_SOLACE: {
		id: 16531,
		name: 'Afflatus Solace',
		icon: iconUrl(2640),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	DIA: {
		id: 16532,
		name: 'Dia',
		icon: iconUrl(2641),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['DIA'],
		mpCost: 400,
	},

	GLARE: {
		id: 16533,
		name: 'Glare',
		icon: iconUrl(2642),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	PLENARY_INDULGENCE: {
		id: 7433,
		name: 'Plenary Indulgence',
		icon: iconUrl(2639),
		cooldown: 60000,
		statusesApplied: ['CONFESSION'],
	},

	STONE_IV: {
		id: 7431,
		name: 'Stone IV',
		icon: iconUrl(2637),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	TETRAGRAMMATON: {
		id: 3570,
		name: 'Tetragrammaton',
		icon: iconUrl(2633),
		cooldown: 60000,
	},

	ASSIZE: {
		id: 3571,
		name: 'Assize',
		icon: iconUrl(2634),
		cooldown: 40000,
	},

	ASYLUM: {
		id: 3569,
		name: 'Asylum',
		icon: iconUrl(2632),
		cooldown: 90000,
		statusesApplied: ['ASYLUM'],
	},

	BENEDICTION: {
		id: 140,
		name: 'Benediction',
		icon: iconUrl(2627),
		cooldown: 180000,
	},

	HOLY: {
		id: 139,
		name: 'Holy',
		icon: iconUrl(2629),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 400,
	},

	PRESENCE_OF_MIND: {
		id: 136,
		name: 'Presence of Mind',
		icon: iconUrl(2626),
		cooldown: 120000,
		statusesApplied: ['PRESENCE_OF_MIND'],
	},

	STONE_III: {
		id: 3568,
		name: 'Stone III',
		icon: iconUrl(2631),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	DIVINE_BENISON: {
		id: 7432,
		name: 'Divine Benison',
		icon: iconUrl(2638),
		cooldown: 30000,
		statusesApplied: ['DIVINE_BENISON'],
		charges: 2,
	},

	THIN_AIR: {
		id: 7430,
		name: 'Thin Air',
		icon: iconUrl(2636),
		cooldown: 120000,
		statusesApplied: ['THIN_AIR'],
		charges: 2,
	},

	AERO_III: {
		id: 3572,
		name: 'Aero III',
		icon: iconUrl(2635),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 400,
	},

	MEDICA_II: {
		id: 133,
		name: 'Medica II',
		icon: iconUrl(409),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		statusesApplied: ['MEDICA_II'],
		mpCost: 1000,
	},

	// the following abilities are to be moved to CNJ.js
	RAISE: {
		id: 125,
		name: 'Raise',
		icon: iconUrl(411),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 8000,
		mpCost: 2400,
	},

	CURE_II: {
		id: 135,
		name: 'Cure II',
		icon: iconUrl(406),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		mpCost: 1000,
	},

	CURE_III: {
		id: 131,
		name: 'Cure III',
		icon: iconUrl(407),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		mpCost: 1500,
	},

	REGEN: {
		id: 137,
		name: 'Regen',
		icon: iconUrl(2628),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['REGEN'],
		mpCost: 400,
	},

	MEDICA: {
		id: 124,
		name: 'Medica',
		icon: iconUrl(408),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		mpCost: 900,
	},

	STONE: {
		id: 119,
		name: 'Stone',
		icon: iconUrl(403),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	AERO_II: {
		id: 132,
		name: 'Aero II',
		icon: iconUrl(402),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
	},

	AERO: {
		id: 121,
		name: 'Aero',
		icon: iconUrl(401),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
	},

	REPOSE: {
		id: 128,
		name: 'Repose',
		icon: iconUrl(414),
		onGcd: true,
		castTime: 2500,
		mpCost: 600,
	},

	STONE_II: {
		id: 127,
		name: 'Stone II',
		icon: iconUrl(404),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	CURE: {
		id: 120,
		name: 'Cure',
		icon: iconUrl(405),
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},
})
