import {Layer} from 'data/layer'
import {ActionRoot} from '../root'
import {BonusModifier} from '../type'

export const patch705: Layer<ActionRoot> = {
	patch: '7.05',
	data: {
		HARD_SLASH: {potencies: [{value: 300, bonusModifiers: []}]},
		SYPHON_STRIKE: {
			potencies: [{
				value: 240,
				bonusModifiers: [],
			},
			{
				value: 380,
				bonusModifiers: [BonusModifier.COMBO],
			}],
		},
		SOULEATER: {
			potencies: [{
				value: 260,
				bonusModifiers: [],
			},
			{
				value: 480,
				bonusModifiers: [BonusModifier.COMBO],
			}],
		},
		CARVE_AND_SPIT: {potencies: [{value: 540, bonusModifiers: []}]},
		DISESTEEM: {potencies: [{value: 1000, bonusModifiers: []}]},
		CONTRE_SIXTE: {
			potencies: [{
				value: 420,
				bonusModifiers: [],
			}],
		},
		ENCHANTED_REPRISE: {
			potencies: [{
				value: 420,
				bonusModifiers: [],
			}],
		},
		VERAERO_III: {
			potencies: [{
				value: 440,
				bonusModifiers: [],
			}],
		},
		VERTHUNDER_III: {
			potencies: [{
				value: 440,
				bonusModifiers: [],
			}],
		},
		STARDIVER: {potencies: [{value: 720, bonusModifiers: []}]},
		STARCROSS: {potencies: [{value: 900, bonusModifiers: []}]},
		// SAM stuff
		MEIKYO_SHISUI: {statusesApplied: ['MEIKYO_SHISUI']},
		MIDARE_SETSUGEKKA: {statusesApplied: ['TSUBAME_GAESHI_READY']},
		TENDO_SETSUGEKKA: {statusesApplied: ['TSUBAME_GAESHI_READY']},
		TENDO_GOKEN: {statusesApplied: ['TSUBAME_GAESHI_READY']},
		TENKA_GOKEN: {statusesApplied: ['TSUBAME_GAESHI_READY']},

		GEKKO: {
			potencies: [{
				value: 160,
				bonusModifiers: [],
			}, {
				value: 210,
				bonusModifiers: [BonusModifier.POSITIONAL],
			}, {
				value: 370,
				bonusModifiers: [BonusModifier.COMBO],
			}, {
				value: 420,
				bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
			}],
		},

		KASHA: {
			potencies: [{
				value: 160,
				bonusModifiers: [],
			}, {
				value: 210,
				bonusModifiers: [BonusModifier.POSITIONAL],
			}, {
				value: 370,
				bonusModifiers: [BonusModifier.COMBO],
			}, {
				value: 420,
				bonusModifiers: [BonusModifier.POSITIONAL, BonusModifier.COMBO],
			}],
		},

		PHANTOM_RUSH: {
			potencies: [{
				value: 1500,
				bonusModifiers: [],
			}],
		},
		WINDS_REPLY: {
			potencies: [{
				value: 900,
				bonusModifiers: [],
			}],
		},
		FIRES_REPLY: {
			potencies: [{
				value: 1200,
				bonusModifiers: [],
			}],
		},

		//AST 7.05 changes
		//previously these all were cooldown group 2, but with the timeline we synthed different ones anyway. note left here for reference
		PLAY_II: {cooldownGroup: 3},
		THE_BOLE: {cooldownGroup: 3},
		THE_ARROW: {cooldownGroup: 3},
		PLAY_III: {cooldownGroup: 4},
		THE_EWER: {cooldownGroup: 4},
		THE_SPIRE: {cooldownGroup: 4},
	},
}
