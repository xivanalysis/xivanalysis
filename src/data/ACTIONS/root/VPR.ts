import {iconUrl} from 'data/icon'
import {Attribute} from 'event'
import {ensureActions, BonusModifier} from '../type'
import {SHARED} from './SHARED'

//Viper Actions

export const VPR = ensureActions({
	// -----
	// Player GCDs
	// -----

	// Single target GCDs

	//Steel Fangs + Transformation Actions
	STEEL_FANGS: {
		id: 34606,
		name: 'Steel Fangs',
		icon: iconUrl(3701),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
	},

	HUNTERS_STING: {
		id: 34608,
		name: "Hunter's Sting",
		icon: iconUrl(3703),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34606,
				34607,
			],
		},
		statusesApplied: ['HUNTERS_INSTINCT'],
	},

	HINDSTING_STRIKE: {
		id: 34612,
		name: 'Hindsting Strike',
		icon: iconUrl(3707),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34608,
				34609,
			],
			end: true,
		},
		statusesApplied: ['FLANKSBANE_VENOM'],
		potencies: [
			// just go read this. Big thanks to Hint for helping with math jank https://discord.com/channels/441414116914233364/470050640005955605/1272595506367041639
			{
				value: 160,
				bonusModifiers: [],
			},
			// with venom, the base gets +100p
			{
				value: 260,
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
		id: 34610,
		name: 'Flanksting Strike',
		icon: iconUrl(3705),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34608,
				34609,
			],
			end: true,
		},
		statusesApplied: ['HINDSTUNG_VENOM'],
		potencies: [
			// // just go read this. Big thanks to Hint for helping with math jank https://discord.com/channels/441414116914233364/470050640005955605/1272595506367041639
			{
				value: 160,
				bonusModifiers: [],
			},
			// with venom, the base gets +100p
			{
				value: 260,
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

	//Dread Fangs + Transformation Actions
	DREAD_FANGS: {
		id: 34607,
		name: 'Dread Fangs',
		icon: iconUrl(3702),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
		statusesApplied: ['NOXIOUS_GNASH'],
	},

	REAVING_FANGS: SHARED.UNKNOWN,

	SWIFTSKINS_STING: {
		id: 34609,
		name: "Swiftskin's Sting",
		icon: iconUrl(3704),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34606,
				34607,
			],
		},
		statusesApplied: ['SWIFTSCALED'],
	},

	HINDSBANE_FANG: {
		id: 34613,
		name: 'Hindbane Fang',
		icon: iconUrl(3708),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34608,
				34609,
			],
			end: true,
		},
		statusesApplied: ['FLANKSTUNG_VENOM'],
		potencies: [
			// just go read this. Big thanks to Hint for helping with math jank https://discord.com/channels/441414116914233364/470050640005955605/1272595506367041639
			{
				value: 160,
				bonusModifiers: [],
			},
			// with venom, the base gets +100p
			{
				value: 260,
				bonusModifiers: [],
				baseModifiers: ['HINDSBANE_VENOM'],
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
		id: 34611,
		name: 'Flanksbane Fang',
		icon: iconUrl(3706),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34608,
				34609,
			],
			end: true,
		},
		statusesApplied: ['HINDSBANE_VENOM'],
		potencies: [
			// just go read this. Big thanks to Hint for helping with math jank https://discord.com/channels/441414116914233364/470050640005955605/1272595506367041639
			{
				value: 160,
				bonusModifiers: [],
			},
			// with venom, the base gets +100p
			{
				value: 260,
				bonusModifiers: [],
				baseModifiers: ['FLANKSBANE_VENOM'],
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

	WRITHING_SNAP: {
		id: 34632,
		name: 'Writhing Snap',
		icon: iconUrl(3727),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	//Dreadwinder "combo"

	DREADWINDER: {
		id: 34620,
		name: 'Dreadwinder',
		icon: iconUrl(3715),
		onGcd: true,
		breaksCombo: false,
		gcdRecast: 3000,
		cooldown: 40000,
		charges: 2,
		statusesApplied: ['NOXIOUS_GNASH'],
		cooldownGroup: 15,
	},

	VICEWINDER: SHARED.UNKNOWN,

	HUNTERS_COIL: {
		id: 34621,
		name: "Hunter's Coil",
		icon: iconUrl(3716),
		onGcd: true,
		gcdRecast: 3000,
		breaksCombo: false,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: [
			'HUNTERS_INSTINCT',
			'HUNTERS_VENOM',
		],
		potencies: [{
			value: 500,
			bonusModifiers: [],
		}, {
			value: 550,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}],
	},

	SWIFTSKINS_COIL: {
		id: 34622,
		name: "Swiftskin's Coil",
		icon: iconUrl(3717),
		onGcd: true,
		gcdRecast: 3000,
		breaksCombo: false,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: [
			'SWIFTSCALED',
			'SWIFTSKINS_VENOM',
		],
		potencies: [{
			value: 500,
			bonusModifiers: [],
		}, {
			value: 550,
			bonusModifiers: [BonusModifier.POSITIONAL],
		}],
	},

	// AoE GCDs

	//Stel Maw + Transformation Actions
	STEEL_MAW: {
		id: 34614,
		name: 'Steel Maw',
		icon: iconUrl(3709),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},

	},

	HUNTERS_BITE: {
		id: 34616,
		name: "Hunter's Bite",
		icon: iconUrl(3711),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34614,
				34615,
			],
		},
		statusesApplied: ['HUNTERS_INSTINCT'],
	},

	JAGGED_MAW: {
		id: 34618,
		name: 'Jagged Maw',
		icon: iconUrl(3713),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34616,
				34617,
			],
			end: true,
		},
	},

	//Dread Maw + Transformation Actions
	DREAD_MAW: {
		id: 34615,
		name: 'Dread Maw',
		icon: iconUrl(3710),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			start: true,
		},
		statusesApplied: ['NOXIOUS_GNASH'],
	},

	REAVING_MAW: SHARED.UNKNOWN,

	SWIFTSKINS_BITE: {
		id: 34617,
		name: "Swiftskin's Bite",
		icon: iconUrl(3712),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34614,
				34615,
			],
		},
		statusesApplied: ['SWIFTSCALED'],
	},

	BLOODIED_MAW:
	{
		id: 34619,
		name: 'Bloodied Maw',
		icon: iconUrl(3714),
		onGcd: true,
		speedAttribute: Attribute.SKILL_SPEED,
		combo: {
			from: [
				34616,
				34617,
			],
			end: true,
		},
	},

	//Pit of dread "combo"

	PIT_OF_DREAD: {
		id: 34623,
		name: 'Pit of Dread',
		icon: iconUrl(3718),
		onGcd: true,
		gcdRecast: 3000,
		breaksCombo: false,
		cooldown: 40000,
		charges: 2,
		statusesApplied: ['NOXIOUS_GNASH'],
		cooldownGroup: 15,
	},

	VICEPIT: SHARED.UNKNOWN,

	HUNTERS_DEN: {
		id: 34624,
		name: "Hunter's Den",
		icon: iconUrl(3719),
		onGcd: true,
		gcdRecast: 3000,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		statusesApplied: [
			'HUNTERS_INSTINCT',
			'FELLHUNTERS_VENOM',
		],
	},

	SWIFTSKINS_DEN: {
		id: 34625,
		name: "Swiftskin's Den",
		icon: iconUrl(3720),
		onGcd: true,
		gcdRecast: 3000,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		statusesApplied: [
			'SWIFTSCALED',
			'FELLSKINS_VENOM',
		],
	},

	UNCOILED_FURY: {
		id: 34633,
		name: 'Uncoiled Fury',
		icon: iconUrl(3728),
		onGcd: true,
		gcdRecast: 3500,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
		statusesApplied: ['POISED_FOR_TWINFANG'],
	},

	// ReAwaken & Generations.
	// Generation is not a true combo. It is a skill that is buffed by following the generation before it.
	// There is 0 reason to start the combo anyway but from the first generation , so it is being defined as a combo.

	REAWAKEN: {
		id: 34626,
		name: 'Reawaken',
		icon: iconUrl(3721),
		onGcd: true,
		gcdRecast: 2200,
		breaksCombo: false,
		speedAttribute: Attribute.SKILL_SPEED,
		statusesApplied: ['REAWAKENED'],
	},

	FIRST_GENERATION: {
		id: 34627,
		name: 'First Generation',
		icon: iconUrl(3722),
		onGcd: true,
		breaksCombo: false,
		gcdRecast: 2000,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	SECOND_GENERATION: {
		id: 34628,
		name: 'Second Generation',
		icon: iconUrl(3723),
		onGcd: true,
		breaksCombo: false,
		gcdRecast: 2000,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	THIRD_GENERATION: {
		id: 34629,
		name: 'Third Generation',
		icon: iconUrl(3724),
		onGcd: true,
		breaksCombo: false,
		gcdRecast: 2000,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	FOURTH_GENERATION: {
		id: 34630,
		name: 'Fourth Generation',
		icon: iconUrl(3725),
		onGcd: true,
		breaksCombo: false,
		gcdRecast: 2000,
		speedAttribute: Attribute.SKILL_SPEED,
	},

	OUROBOROS: {
		id: 34631,
		name: 'Ouroboros',
		icon: iconUrl(3726),
		onGcd: true,
		gcdRecast: 3000,
		speedAttribute: Attribute.SKILL_SPEED,
		breaksCombo: false,
	},

	// -----
	// Player oGCDs
	// -----

	SERPENTS_IRE:
	{
		id: 34647,
		name: "Serpent's Ire",
		icon: iconUrl(3742),
		cooldown: 120000,
		statusesApplied: ['READY_TO_REAWAKEN'],
	},

	SLITHER: {
		id: 34646,
		name: 'Slither',
		icon: iconUrl(3741),
		cooldown: 30000,
		charges: 3,
	},

	// Seperent's tail and transformation skills.
	// It is not possible to cast Seprent's tail and there is no status tied to it's transformative skills being usable.
	// This skill and twinblood/twinfang are being defined for the sake of being able to datalink to them for suggestions.
	SERPENTS_TAIL: {
		id: 35920,
		name: "Serpent's Tail",
		icon: iconUrl(3743),
		cooldown: 1000,
	},

	DEATH_RATTLE: {
		id: 34634,
		name: 'Death Rattle',
		icon: iconUrl(3729),
		cooldown: 1000,
	},

	LAST_LASH: {
		id: 34635,
		name: 'Last Lash',
		icon: iconUrl(3730),
		cooldown: 1000,
	},

	FIRST_LEGACY: {
		id: 34640,
		name: 'First Legacy',
		icon: iconUrl(3735),
		cooldown: 1000,
	},

	SECOND_LEGACY: {
		id: 34641,
		name: 'Second Legacy',
		icon: iconUrl(3736),
		cooldown: 1000,
	},

	THIRD_LEGACY: {
		id: 34642,
		name: 'Third Legacy',
		icon: iconUrl(3737),
		cooldown: 1000,
	},

	FOURTH_LEGACY: {
		id: 34643,
		name: 'Fourth Legacy',
		icon: iconUrl(3738),
		cooldown: 1000,
	},

	// Twinblood and transformation skills.
	TWINBLOOD: {
		id: 35922,
		name: 'Twinblood',
		icon: iconUrl(3745),
		cooldown: 1000,
	},

	TWINBLOOD_BITE: {
		id: 34637,
		name: 'Twinblood Bite',
		icon: iconUrl(3732),
		cooldown: 1000,
	},

	TWINBLOOD_THRESH: {
		id: 34639,
		name: 'Twinblood Thresh',
		icon: iconUrl(3734),
		cooldown: 1000,
	},

	UNCOILED_TWINBLOOD: {
		id: 34645,
		name: 'Uncoiled Twinblood',
		icon: iconUrl(3740),
		cooldown: 1000,
	},

	// Twinfang and transformation skills.
	TWINFANG: {
		id: 35921,
		name: 'Twinfang',
		icon: iconUrl(3744),
		cooldown: 1000,
	},

	TWINFANG_BITE: {
		id: 34636,
		name: 'Twinfang Bite',
		icon: iconUrl(3731),
		cooldown: 1000,
		statusesApplied: ['SWIFTSKINS_VENOM'],
	},

	TWINFANG_THRESH: {
		id: 34638,
		name: 'Twinfang Thresh',
		icon: iconUrl(3733),
		cooldown: 1000,
		statusesApplied: ['FELLSKINS_VENOM'],
	},

	UNCOILED_TWINFANG: {
		id: 34644,
		name: 'Uncoiled Twinfang',
		icon: iconUrl(3739),
		cooldown: 1000,
		statusesApplied: ['POISED_FOR_TWINBLOOD'],
	},

})
