import {iconUrl} from 'data/icon'
import {Layer} from 'data/layer'
import {Attribute} from 'event'
import {ActionRoot} from '../root'
import {SHARED} from '../root/SHARED'
import {BonusModifier} from '../type'

export const patch705: Layer<ActionRoot> = {
	patch: '7.05',
	data: {
		// My Viper, WHY?!
		STEEL_FANGS: {statusesApplied: ['HONED_REAVERS']},
		DREAD_FANGS: {...SHARED.UNKNOWN, onGcd: undefined, speedAttribute: undefined},
		REAVING_FANGS: {
			id: 34607,
			name: 'Reaving Fangs',
			icon: iconUrl(3702),
			onGcd: true,
			speedAttribute: Attribute.SKILL_SPEED,
			combo: {
				start: true,
			},
			statusesApplied: ['HONED_STEEL'],

		},

		HINDSTING_STRIKE: {
			potencies: [
				// untraited Reaving Fangs is the "base GCD" here
				{
					value: 120,
					bonusModifiers: [],
				},
				// with venom, the base gets +80p
				{
					value: 200,
					bonusModifiers: [],
					baseModifiers: ['HINDSTUNG_VENOM'],
				},
				// the base potency of Hindsting Strike itself is treated as a "combo"
				{
					value: 340,
					bonusModifiers: [BonusModifier.COMBO],
					baseModifiers: [],
				},
				// +60p with positional
				{
					value: 400,
					bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
					baseModifiers: [],
				},
				// +100p with venom
				{
					value: 440,
					bonusModifiers: [BonusModifier.COMBO],
					baseModifiers: ['HINDSTUNG_VENOM'],
				},
				// +160p with venom + positional
				{
					value: 500,
					bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
					baseModifiers: ['HINDSTUNG_VENOM'],
				},
			],
		},
		FLANKSTING_STRIKE: {
			potencies: [
				// untraited Dread Fangs is the "base GCD" here
				{
					value: 120,
					bonusModifiers: [],
				},
				// with venom, the base gets +80p
				{
					value: 200,
					bonusModifiers: [],
					baseModifiers: ['FLANKSTUNG_VENOM'],
				},
				// the base potency of Hindsting Strike itself is treated as a "combo"
				{
					value: 340,
					bonusModifiers: [BonusModifier.COMBO],
					baseModifiers: [],
				},
				// +60p with positional
				{
					value: 400,
					bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
					baseModifiers: [],
				},
				// +100p with venom
				{
					value: 440,
					bonusModifiers: [BonusModifier.COMBO],
					baseModifiers: ['FLANKSTUNG_VENOM'],
				},
				// +160p with venom + positional
				{
					value: 500,
					bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
					baseModifiers: ['FLANKSTUNG_VENOM'],
				},
			],
		},
		HINDSBANE_FANG: {
			potencies: [
				// untraited Dread Fangs is the "base GCD" here
				{
					value: 120,
					bonusModifiers: [],
				},
				// with venom, the base gets +80p or is base potency of Reaving
				{
					value: 200,
					bonusModifiers: [],
					baseModifiers: ['HINDSBANE_VENOM'],
				},
				// the base potency of the skill itself is treated as a "combo"
				{
					value: 340,
					bonusModifiers: [BonusModifier.COMBO],
					baseModifiers: [],
				},
				// +60p with positional
				{
					value: 400,
					bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
					baseModifiers: [],
				},
				// +100p with venom
				{
					value: 440,
					bonusModifiers: [BonusModifier.COMBO],
					baseModifiers: ['HINDSBANE_VENOM'],
				},
				// +160p with venom + positional
				{
					value: 500,
					bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
					baseModifiers: ['HINDSBANE_VENOM'],
				},
			],
		},
		FLANKSBANE_FANG: {
			potencies: [
				// untraited Dread Fangs is the "base GCD" here
				{
					value: 120,
					bonusModifiers: [],
				},
				// with venom, the base gets +80p
				{
					value: 200,
					bonusModifiers: [],
					baseModifiers: ['FLANKSBANE_VENOM'],
				},
				// the base potency of skill itself is treated as a "combo"
				{
					value: 340,
					bonusModifiers: [BonusModifier.COMBO],
					baseModifiers: [],
				},
				// +60p with positional
				{
					value: 400,
					bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
					baseModifiers: [],
				},
				// +100p with venom
				{
					value: 440,
					bonusModifiers: [BonusModifier.COMBO],
					baseModifiers: ['FLANKSBANE_VENOM'],
				},
				// +160p with venom + positional
				{
					value: 500,
					bonusModifiers: [BonusModifier.COMBO, BonusModifier.POSITIONAL],
					baseModifiers: ['FLANKSBANE_VENOM'],
				},
			],
		},

		STEEL_MAW: {statusesApplied: ['HONED_REAVERS']},
		DREAD_MAW: {...SHARED.UNKNOWN, onGcd: undefined, speedAttribute: undefined},
		REAVING_MAW: {
			id: 34615,
			name: 'Reaving Maw',
			icon: iconUrl(3710),
			onGcd: true,
			speedAttribute: Attribute.SKILL_SPEED,
			combo: {
				start: true,
			},
			statusesApplied: ['HONED_STEEL'],
		},

		DREADWINDER: {...SHARED.UNKNOWN, onGcd: undefined, speedAttribute: undefined, breaksCombo: undefined},
		VICEWINDER: {
			id: 34620,
			name: 'Vicewinder',
			icon: iconUrl(3715),
			onGcd: true,
			breaksCombo: false,
			gcdRecast: 3000,
			cooldown: 40000,
			charges: 2,
			cooldownGroup: 15,
		},
		HUNTERS_COIL: {
			potencies: [{
				value: 570,
				bonusModifiers: [],
			}, {
				value: 620,
				bonusModifiers: [BonusModifier.POSITIONAL],
			}],
		},
		SWIFTSKINS_COIL: {
			potencies: [{
				value: 570,
				bonusModifiers: [],
			}, {
				value: 620,
				bonusModifiers: [BonusModifier.POSITIONAL],
			}],
		},

		PIT_OF_DREAD: {...SHARED.UNKNOWN, onGcd: undefined, speedAttribute: undefined, breaksCombo: undefined},
		VICEPIT: {
			id: 34623,
			name: 'Vicepit',
			icon: iconUrl(3718),
			onGcd: true,
			gcdRecast: 3000,
			breaksCombo: false,
			cooldown: 40000,
			charges: 2,
			cooldownGroup: 15,
		},

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
