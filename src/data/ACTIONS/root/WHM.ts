import {Attribute} from 'event'
import {ensureActions} from '../type'

export const WHM = ensureActions({
	LITURGY_OF_THE_BELL: {
		id: 25862,
		name: 'Liturgy of the Bell',
		icon: 'https://xivapi.com/i/002000/002649.png',
		cooldown: 180000,
		statusesApplied: ['LITURGY_OF_THE_BELL'],
	},

	AQUAVEIL: {
		id: 25861,
		name: 'Aquaveil',
		icon: 'https://xivapi.com/i/002000/002648.png',
		cooldown: 60000,
		statusesApplied: ['AQUAVEIL'],
	},

	HOLY_III: {
		id: 25860,
		name: 'Holy III',
		icon: 'https://xivapi.com/i/002000/002647.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 400,
    	},

	GLARE_III: {
		id: 25859,
		name: 'Glare III',
		icon: 'https://xivapi.com/i/002000/002646.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	TEMPERANCE: {
		id: 16536,
		name: 'Temperance',
		icon: 'https://xivapi.com/i/002000/002645.png',
		cooldown: 120000,
		statusesApplied: ['TEMPERANCE'],
	},

	AFFLATUS_MISERY: {
		id: 16535,
		name: 'Afflatus Misery',
		icon: 'https://xivapi.com/i/002000/002644.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	AFFLATUS_RAPTURE: {
		id: 16534,
		name: 'Afflatus Rapture',
		icon: 'https://xivapi.com/i/002000/002643.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	AFFLATUS_SOLACE: {
		id: 16531,
		name: 'Afflatus Solace',
		icon: 'https://xivapi.com/i/002000/002640.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
	},

	DIA: {
		id: 16532,
		name: 'Dia',
		icon: 'https://xivapi.com/i/002000/002641.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['DIA'],
		mpCost: 400,
	},

	GLARE: {
		id: 16533,
		name: 'Glare',
		icon: 'https://xivapi.com/i/002000/002642.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	PLENARY_INDULGENCE: {
		id: 7433,
		name: 'Plenary Indulgence',
		icon: 'https://xivapi.com/i/002000/002639.png',
		cooldown: 60000,
		statusesApplied: ['CONFESSION'],
	},

	STONE_IV: {
		id: 7431,
		name: 'Stone IV',
		icon: 'https://xivapi.com/i/002000/002637.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	TETRAGRAMMATON: {
		id: 3570,
		name: 'Tetragrammaton',
		icon: 'https://xivapi.com/i/002000/002633.png',
		cooldown: 60000,
	},

	ASSIZE: {
		id: 3571,
		name: 'Assize',
		icon: 'https://xivapi.com/i/002000/002634.png',
		cooldown: 45000,
	},

	ASYLUM: {
		id: 3569,
		name: 'Asylum',
		icon: 'https://xivapi.com/i/002000/002632.png',
		cooldown: 90000,
		statusesApplied: ['ASYLUM'],
	},

	BENEDICTION: {
		id: 140,
		name: 'Benediction',
		icon: 'https://xivapi.com/i/002000/002627.png',
		cooldown: 180000,
	},

	HOLY: {
		id: 139,
		name: 'Holy',
		icon: 'https://xivapi.com/i/002000/002629.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 400,
	},

	PRESENCE_OF_MIND: {
		id: 136,
		name: 'Presence of Mind',
		icon: 'https://xivapi.com/i/002000/002626.png',
		cooldown: 120000,
		statusesApplied: ['PRESENCE_OF_MIND'],
	},

	STONE_III: {
		id: 3568,
		name: 'Stone III',
		icon: 'https://xivapi.com/i/002000/002631.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	DIVINE_BENISON: {
		id: 7432,
		name: 'Divine Benison',
		icon: 'https://xivapi.com/i/002000/002638.png',
		cooldown: 30000,
		statusesApplied: ['DIVINE_BENISON'],
        charges: 2,
	},

	THIN_AIR: {
		id: 7430,
		name: 'Thin Air',
		icon: 'https://xivapi.com/i/002000/002636.png',
		cooldown: 120000,
		statusesApplied: ['THIN_AIR'],
        charges: 2,
	},

	AERO_III: {
		id: 3572,
		name: 'Aero III',
		icon: 'https://xivapi.com/i/002000/002635.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2500,
		mpCost: 400,
	},

	MEDICA_II: {
		id: 133,
		name: 'Medica II',
		icon: 'https://xivapi.com/i/000000/000409.png',
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
		icon: 'https://xivapi.com/i/000000/000411.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 8000,
		mpCost: 2400,
	},

	CURE_II: {
		id: 135,
		name: 'Cure II',
		icon: 'https://xivapi.com/i/000000/000406.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		mpCost: 1000,
	},

	CURE_III: {
		id: 131,
		name: 'Cure III',
		icon: 'https://xivapi.com/i/000000/000407.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		mpCost: 1500,
	},

	REGEN: {
		id: 137,
		name: 'Regen',
		icon: 'https://xivapi.com/i/002000/002628.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		statusesApplied: ['REGEN'],
		mpCost: 500,
	},

	MEDICA: {
		id: 124,
		name: 'Medica',
		icon: 'https://xivapi.com/i/000000/000408.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 2000,
		mpCost: 900,
	},

	STONE: {
		id: 119,
		name: 'Stone',
		icon: 'https://xivapi.com/i/000000/000403.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	AERO_II: {
		id: 132,
		name: 'Aero II',
		icon: 'https://xivapi.com/i/000000/000402.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
	},

	AERO: {
		id: 121,
		name: 'Aero',
		icon: 'https://xivapi.com/i/000000/000401.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		mpCost: 400,
	},

	REPOSE: {
		id: 128,
		name: 'Repose',
		icon: 'https://xivapi.com/i/000000/000414.png',
		onGcd: true,
		castTime: 2500,
		mpCost: 600,
	},

	STONE_II: {
		id: 127,
		name: 'Stone II',
		icon: 'https://xivapi.com/i/000000/000404.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},

	CURE: {
		id: 120,
		name: 'Cure',
		icon: 'https://xivapi.com/i/000000/000405.png',
		onGcd: true,
		speedAttribute: Attribute.SPELL_SPEED,
		castTime: 1500,
		mpCost: 400,
	},
})
