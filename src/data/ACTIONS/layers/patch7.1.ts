import {Layer} from 'data/layer'
import {ActionRoot} from '../root'

export const patch710: Layer<ActionRoot> = {
	patch: '7.1',
	data: {
		// drg is not the same :o
		ELUSIVE_JUMP: {
			statusesApplied: ['ENHANCED_PIERCING_TALON'],
		},
		PIERCING_TALON: {
			potencies: [
				{
					value: 200,
					bonusModifiers: [],
				},
				{
					value: 350,
					bonusModifiers: [],
					baseModifiers: ['ENHANCED_PIERCING_TALON'],
				},
			],
		},
		MIRAGE_DIVE: {
			potencies: [
				{
					value: 380,
					bonusModifiers: [],
				},
			],
		},
		NASTROND: {
			potencies: [
				{
					value: 720,
					bonusModifiers: [],
				},
			],
		},
		STARDIVER: {
			potencies: [
				{
					value: 720,
					bonusModifiers: [],
				},
			],
		},
		STARCROSS: {
			potencies: [
				{
					value: 1000,
					bonusModifiers: [],
				},
			],
		},
		//SAM
		HISSATSU_GYOTEN: {cooldown: 5000}, //10s -> 5s

		// BLM action changes for 7.1
		LEY_LINES: {
			charges: 2, // Ley Lines now has two charges
		},
		DESPAIR: {
			castTime: 0, // Despair is now instant cast by default without needing Swift/Triple
		},
		FLARE: {
			castTime: 3000,
		},
	},
}
