import {Attribute, DamageType} from 'event'
import {Action, ensureActions} from '../type'

const MAGICAL = DamageType.MAGICAL
const PHYSICAL = DamageType.PHYSICAL
const DARK = DamageType.DARK

export const BLU_COOLDOWN_GROUPS = {
	OFF_GUARD: 11411,
	FEATHER_RAIN: 11426,
	BLU_MOUNTAIN_BUSTER: 11428,
	GLASS_DANCE: 11430,
	QUASAR: 18324,
	NIGHTBLOOM: 23290,
	THE_ROSE_OF_DESTRUCTION: 23275,
	MATRA_MAGIC: 23285,
	MAGIC_HAMMER: 18305,
	BEING_MORTAL: 34582,
}

const UMBRAL   = 1 // Water, Earth, Ice
const ASTRAL   = 2 // Fire, Wind, Lightning

export interface BlueAction extends Action {
    elementType?: number,
}

export const BLU = ensureActions({
	// TODO: may need to go deeper on statuses applied in the future?
	WATER_CANNON: {
		id: 11385,
		name: 'Water Cannon',
		icon: 'https://xivapi.com/i/003000/003253.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FLAME_THROWER: {
		id: 11402,
		name: 'Flame Thrower',
		icon: 'https://xivapi.com/i/003000/003270.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	AQUA_BREATH: {
		id: 11390,
		name: 'Aqua Breath',
		icon: 'https://xivapi.com/i/003000/003258.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['AQUA_BREATH'],
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FLYING_FRENZY: {
		id: 11389,
		name: 'Flying Frenzy',
		icon: 'https://xivapi.com/i/003000/003257.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DRILL_CANNONS: {
		id: 11398,
		name: 'Drill Cannons',
		icon: 'https://xivapi.com/i/003000/003266.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	HIGH_VOLTAGE: {
		id: 11387,
		name: 'High Voltage',
		icon: 'https://xivapi.com/i/003000/003255.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['PARALYSIS'],
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	LOOM: {
		id: 11401,
		name: 'Loom',
		icon: 'https://xivapi.com/i/003000/003269.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FINAL_STING: {
		id: 11407,
		name: 'Final Sting',
		icon: 'https://xivapi.com/i/003000/003275.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['BRUSH_WITH_DEATH'],
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SONG_OF_TORMENT: {
		id: 11386,
		name: 'Song of Torment',
		icon: 'https://xivapi.com/i/003000/003254.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['BLEEDING'],
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	GLOWER: {
		id: 11404,
		name: 'Glower',
		icon: 'https://xivapi.com/i/003000/003272.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['PARALYSIS'],
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	PLAINCRACKER: {
		id: 11391,
		name: 'Plaincracker',
		icon: 'https://xivapi.com/i/003000/003259.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BRISTLE: {
		id: 11393,
		name: 'Bristle',
		icon: 'https://xivapi.com/i/003000/003261.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		statusesApplied: ['BRISTLE'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	WHITE_WIND: {
		id: 11406,
		name: 'White Wind',
		icon: 'https://xivapi.com/i/003000/003274.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	LEVEL_5_PETRIFY: {
		id: 11414,
		name: 'Level 5 Petrify',
		icon: 'https://xivapi.com/i/003000/003282.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['PETRIFICATION'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SHARPENED_KNIFE: {
		id: 11400,
		name: 'Sharpened Knife',
		icon: 'https://xivapi.com/i/003000/003268.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	ICE_SPIKES: {
		id: 11418,
		name: 'Ice Spikes',
		icon: 'https://xivapi.com/i/003000/003286.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['ICE_SPIKES', 'SLOW'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BLOOD_DRAIN: {
		id: 11395,
		name: 'Blood Drain',
		icon: 'https://xivapi.com/i/003000/003263.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	ACORN_BOMB: {
		id: 11392,
		name: 'Acorn Bomb',
		icon: 'https://xivapi.com/i/003000/003260.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['SLEEP'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BOMB_TOSS: {
		id: 11396,
		name: 'Bomb Toss',
		icon: 'https://xivapi.com/i/003000/003264.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['STUN'],
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	OFF_GUARD: {
		id: 11411,
		name: 'Off-guard',
		icon: 'https://xivapi.com/i/003000/003279.png',
		castTime: 1000,
		cooldown: 60000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.OFF_GUARD,
		statusesApplied: ['OFF_GUARD'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SELF_DESTRUCT: {
		id: 11408,
		name: 'Self-destruct',
		icon: 'https://xivapi.com/i/003000/003276.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['BRUSH_WITH_DEATH'],
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	TRANSFUSION: {
		id: 11409,
		name: 'Transfusion',
		icon: 'https://xivapi.com/i/003000/003277.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['BRUSH_WITH_DEATH'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FAZE: {
		id: 11403,
		name: 'Faze',
		icon: 'https://xivapi.com/i/003000/003271.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['STUN'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FLYING_SARDINE: {
		id: 11423,
		name: 'Flying Sardine',
		icon: 'https://xivapi.com/i/003000/003291.png',
		onGcd: true,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SNORT: {
		id: 11383,
		name: 'Snort',
		icon: 'https://xivapi.com/i/003000/003251.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FOUR_TONZE_WEIGHT: {
		id: 11384,
		name: '4-tonze Weight',
		icon: 'https://xivapi.com/i/003000/003252.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['HEAVY'],
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	THE_LOOK: {
		id: 11399,
		name: 'The Look',
		icon: 'https://xivapi.com/i/003000/003267.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BAD_BREATH: {
		id: 11388,
		name: 'Bad Breath',
		icon: 'https://xivapi.com/i/003000/003256.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['MALODOROUS', 'BAD_BREATH_POISON', 'SLOW', 'HEAVY', 'BLIND', 'PARALYSIS'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DIAMONDBACK: {
		id: 11424,
		name: 'Diamondback',
		icon: 'https://xivapi.com/i/003000/003292.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['DIAMONDBACK'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MIGHTY_GUARD: {
		id: 11417,
		name: 'Mighty Guard',
		icon: 'https://xivapi.com/i/003000/003285.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['MIGHTY_GUARD'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	STICKY_TONGUE: {
		id: 11412,
		name: 'Sticky Tongue',
		icon: 'https://xivapi.com/i/003000/003280.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['STUN'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	TOAD_OIL: {
		id: 11410,
		name: 'Toad Oil',
		icon: 'https://xivapi.com/i/003000/003278.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['TOAD_OIL'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	THE_RAMS_VOICE: {
		id: 11419,
		name: 'The Ram\'s Voice',
		icon: 'https://xivapi.com/i/003000/003287.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['DEEP_FREEZE'],
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	THE_DRAGONS_VOICE: {
		id: 11420,
		name: 'The Dragon\'s Voice',
		icon: 'https://xivapi.com/i/003000/003288.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['PARALYSIS'],
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MISSILE: {
		id: 11405,
		name: 'Missile',
		icon: 'https://xivapi.com/i/003000/003273.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: DARK,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	THOUSAND_NEEDLES: {
		id: 11397,
		name: '1000 Needles',
		icon: 'https://xivapi.com/i/003000/003265.png',
		onGcd: true,
		castTime: 6000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	INK_JET: {
		id: 11422,
		name: 'Ink Jet',
		icon: 'https://xivapi.com/i/003000/003290.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['BLIND'],
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FIRE_ANGON: {
		id: 11425,
		name: 'Fire Angon',
		icon: 'https://xivapi.com/i/003000/003293.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		damageType: PHYSICAL, // Fire Angon is considered Piercing/Fire, but it only gets a boost from Physical buffs
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MOON_FLUTE: {
		id: 11415,
		name: 'Moon Flute',
		icon: 'https://xivapi.com/i/003000/003283.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['WAXING_NOCTURNE', 'WANING_NOCTURNE'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	TAIL_SCREW: {
		id: 11413,
		name: 'Tail Screw',
		icon: 'https://xivapi.com/i/003000/003281.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MIND_BLAST: {
		id: 11394,
		name: 'Mind Blast',
		icon: 'https://xivapi.com/i/003000/003262.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		statusesApplied: ['PARALYSIS'],
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DOOM: {
		id: 11416,
		name: 'Doom',
		icon: 'https://xivapi.com/i/003000/003284.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['DOOM'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	PECULIAR_LIGHT: {
		id: 11421,
		name: 'Peculiar Light',
		icon: 'https://xivapi.com/i/003000/003289.png',
		castTime: 1000,
		cooldown: 60000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.OFF_GUARD,
		statusesApplied: ['PECULIAR_LIGHT'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FEATHER_RAIN: {
		id: 11426,
		name: 'Feather Rain',
		icon: 'https://xivapi.com/i/003000/003294.png',
		cooldown: 30000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.FEATHER_RAIN,
		statusesApplied: ['FEATHER_RAIN'],
		damageType: MAGICAL,
		elementType: ASTRAL,
	},
	ERUPTION: {
		id: 11427,
		name: 'Eruption',
		icon: 'https://xivapi.com/i/003000/003295.png',
		cooldown: 30000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.FEATHER_RAIN,
		damageType: MAGICAL,
		elementType: ASTRAL,
	},
	BLU_MOUNTAIN_BUSTER: {
		id: 11428,
		name: 'Mountain Buster',
		icon: 'https://xivapi.com/i/003000/003296.png',
		cooldown: 60000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.BLU_MOUNTAIN_BUSTER,
		damageType: PHYSICAL,
		elementType: UMBRAL,
	},
	SHOCK_STRIKE: {
		id: 11429,
		name: 'Shock Strike',
		icon: 'https://xivapi.com/i/003000/003297.png',
		cooldown: 60000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.BLU_MOUNTAIN_BUSTER,
		damageType: MAGICAL,
		elementType: ASTRAL,
	},
	GLASS_DANCE: {
		id: 11430,
		name: 'Glass Dance',
		icon: 'https://xivapi.com/i/003000/003298.png',
		cooldown: 90000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.GLASS_DANCE,
		damageType: MAGICAL,
		elementType: UMBRAL,
	},
	VEIL_OF_THE_WHORL: {
		id: 11431,
		name: 'Veil of the Whorl',
		icon: 'https://xivapi.com/i/003000/003299.png',
		cooldown: 90000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.GLASS_DANCE,
		statusesApplied: ['VEIL_OF_THE_WHORL'],
	},
	ALPINE_DRAFT: {
		id: 18295,
		name: 'Alpine Draft',
		icon: 'https://xivapi.com/i/003000/003300.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	PROTEAN_WAVE: {
		id: 18296,
		name: 'Protean Wave',
		icon: 'https://xivapi.com/i/003000/003301.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	NORTHERLIES: {
		id: 18297,
		name: 'Northerlies',
		icon: 'https://xivapi.com/i/003000/003302.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['DEEP_FREEZE'],
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	ELECTROGENESIS: {
		id: 18298,
		name: 'Electrogenesis',
		icon: 'https://xivapi.com/i/003000/003303.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	KALTSTRAHL: {
		id: 18299,
		name: 'Kaltstrahl',
		icon: 'https://xivapi.com/i/003000/003304.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	ABYSSAL_TRANSFIXION: {
		id: 18300,
		name: 'Abyssal Transfixion',
		icon: 'https://xivapi.com/i/003000/003305.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['PARALYSIS'],
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	CHIRP: {
		id: 18301,
		name: 'Chirp',
		icon: 'https://xivapi.com/i/003000/003306.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['SLEEP'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	EERIE_SOUNDWAVE: {
		id: 18302,
		name: 'Eerie Soundwave',
		icon: 'https://xivapi.com/i/003000/003307.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	POM_CURE: {
		id: 18303,
		name: 'Pom Cure',
		icon: 'https://xivapi.com/i/003000/003308.png',
		onGcd: true,
		castTime: 1500,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	GOBSKIN: {
		id: 18304,
		name: 'Gobskin',
		icon: 'https://xivapi.com/i/003000/003309.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['GOBSKIN'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MAGIC_HAMMER: {
		id: 18305,
		name: 'Magic Hammer',
		icon: 'https://xivapi.com/i/003000/003310.png',
		onGcd: true,
		castTime: 1000,
		cooldown: 90000,
		gcdRecast: 2500,
		statusesApplied: ['MAGIC_HAMMER'],
		cooldownGroup: BLU_COOLDOWN_GROUPS.MAGIC_HAMMER,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	AVAIL: {
		id: 18306,
		name: 'Avail',
		icon: 'https://xivapi.com/i/003000/003311.png',
		onGcd: true,
		castTime: 1000,
		cooldown: 120000,
		gcdRecast: 2500,
		statusesApplied: ['AVAIL_MEATILY_SHIELDED', 'AVAIL_MEAT_SHIELD'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FROG_LEGS: {
		id: 18307,
		name: 'Frog Legs',
		icon: 'https://xivapi.com/i/003000/003312.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SONIC_BOOM: {
		id: 18308,
		name: 'Sonic Boom',
		icon: 'https://xivapi.com/i/003000/003313.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	WHISTLE: {
		id: 18309,
		name: 'Whistle',
		icon: 'https://xivapi.com/i/003000/003314.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		statusesApplied: ['WHISTLE'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	WHITE_KNIGHTS_TOUR: {
		id: 18310,
		name: 'White Knight\'s Tour',
		icon: 'https://xivapi.com/i/003000/003315.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['SLOW'],
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BLACK_KNIGHTS_TOUR: {
		id: 18311,
		name: 'Black Knight\'s Tour',
		icon: 'https://xivapi.com/i/003000/003316.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['BIND'],
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	LEVEL_5_DEATH: {
		id: 18312,
		name: 'Level 5 Death',
		icon: 'https://xivapi.com/i/003000/003317.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 180000,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	LAUNCHER: {
		id: 18313,
		name: 'Launcher',
		icon: 'https://xivapi.com/i/003000/003318.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: DARK,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	PERPETUAL_RAY: {
		id: 18314,
		name: 'Perpetual Ray',
		icon: 'https://xivapi.com/i/003000/003319.png',
		onGcd: true,
		castTime: 3000,
		gcdRecast: 2500,
		statusesApplied: ['STUN'],
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	CACTGUARD: {
		id: 18315,
		name: 'Cactguard',
		icon: 'https://xivapi.com/i/003000/003320.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		statusesApplied: ['CACTGUARD'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	REVENGE_BLAST: {
		id: 18316,
		name: 'Revenge Blast',
		icon: 'https://xivapi.com/i/003000/003321.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	ANGEL_WHISPER: {
		id: 18317,
		name: 'Angel Whisper',
		icon: 'https://xivapi.com/i/003000/003322.png',
		onGcd: true,
		castTime: 10000,
		cooldown: 300000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	EXUVIATION: {
		id: 18318,
		name: 'Exuviation',
		icon: 'https://xivapi.com/i/003000/003323.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	REFLUX: {
		id: 18319,
		name: 'Reflux',
		icon: 'https://xivapi.com/i/003000/003324.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['HEAVY'],
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DEVOUR: {
		id: 18320,
		name: 'Devour',
		icon: 'https://xivapi.com/i/003000/003325.png',
		onGcd: true,
		castTime: 1000,
		cooldown: 60000,
		gcdRecast: 2500,
		statusesApplied: ['DEVOUR'],
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	CONDENSED_LIBRA: {
		id: 18321,
		name: 'Condensed Libra',
		icon: 'https://xivapi.com/i/003000/003326.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['CONDENSED_LIBRA_ASTRAL', 'CONDENSED_LIBRA_UMBRAL', 'CONDENSED_LIBRA_PHYSICAL'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	AETHERIAL_MIMICRY: {
		id: 18322,
		name: 'Aetherial Mimicry',
		icon: 'https://xivapi.com/i/003000/003327.png',
		onGcd: true,
		castTime: 1000,
		gcdRecast: 2500,
		statusesApplied: ['MIMICRY_TANK', 'MIMICRY_DPS', 'MIMICRY_HEALER'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SURPANAKHA: {
		id: 18323,
		name: 'Surpanakha',
		icon: 'https://xivapi.com/i/003000/003328.png',
		cooldown: 30000,
		charges: 4,
		statusesApplied: ['SURPANAKHA'],
		damageType: MAGICAL,
		elementType: UMBRAL,
	},
	QUASAR: {
		id: 18324,
		name: 'Quasar',
		icon: 'https://xivapi.com/i/003000/003329.png',
		cooldown: 60000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.QUASAR,
		damageType: MAGICAL,
	},
	J_KICK: {
		id: 18325,
		name: 'J Kick',
		icon: 'https://xivapi.com/i/003000/003330.png',
		cooldown: 60000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.QUASAR,
		damageType: PHYSICAL,
	},
	TRIPLE_TRIDENT: {
		id: 23264,
		name: 'Triple Trident',
		icon: 'https://xivapi.com/i/003000/003331.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 90000,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	TINGLE: {
		id: 23265,
		name: 'Tingle',
		icon: 'https://xivapi.com/i/003000/003332.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['TINGLING'],
		damageType: MAGICAL,
		elementType: ASTRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	TATAMI_GAESHI: {
		id: 23266,
		name: 'Tatami-gaeshi',
		icon: 'https://xivapi.com/i/003000/003333.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['STUN'],
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	COLD_FOG: {
		id: 23267,
		name: 'Cold Fog',
		icon: 'https://xivapi.com/i/003000/003334.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 90000,
		statusesApplied: ['COLD_FOG'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	WHITE_DEATH: {
		id: 23268,
		name: 'White Death',
		icon: 'https://xivapi.com/i/003000/003335.png',
		onGcd: true,
		gcdRecast: 2500,
		statusesApplied: ['DEEP_FREEZE'],
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	// the attack and heal variations of Stotram share a name and icon but have different IDs.
	STOTRAM_ATTACK: {
		id: 23269,
		name: 'Stotram',
		icon: 'https://xivapi.com/i/003000/003336.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	STOTRAM_HEAL: {
		id: 23416,
		name: 'Stotram',
		icon: 'https://xivapi.com/i/003000/003336.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SAINTLY_BEAM: {
		id: 23270,
		name: 'Saintly Beam',
		icon: 'https://xivapi.com/i/003000/003337.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FECULENT_FLOOD: {
		id: 23271,
		name: 'Feculent Flood',
		icon: 'https://xivapi.com/i/003000/003338.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	ANGELS_SNACK: {
		id: 23272,
		name: 'Angel\'s Snack',
		icon: 'https://xivapi.com/i/003000/003339.png',
		onGcd: true,
		cooldown: 120000,
		castTime: 2000,
		gcdRecast: 2500,
		cooldownGroup: BLU_COOLDOWN_GROUPS.MATRA_MAGIC,
		statusesApplied: ['ANGELS_SNACK'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	CHELONIAN_GATE: {
		id: 23273,
		name: 'Chelonian Gate',
		icon: 'https://xivapi.com//i/003000/003340.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 30000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.THE_ROSE_OF_DESTRUCTION,
		statusesApplied: ['CHELONIAN_GATE', 'AUSPICIOUS_TRANCE'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DIVINE_CATARACT: {
		id: 23274,
		name: 'Divine Cataract',
		icon: 'https://xivapi.com//i/003000/003341.png',
		onGcd: true,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	THE_ROSE_OF_DESTRUCTION: {
		id: 23275,
		name: 'The Rose of Destruction',
		icon: 'https://xivapi.com//i/003000/003342.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 30000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.THE_ROSE_OF_DESTRUCTION,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BASIC_INSTINCT: {
		id: 23276,
		name: 'Basic Instinct',
		icon: 'https://xivapi.com//i/003000/003343.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['BASIC_INSTINCT'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	ULTRAVIBRATION: {
		id: 23277,
		name: 'Ultravibration',
		icon: 'https://xivapi.com//i/003000/003344.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 120000,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BLAZE: {
		id: 23278,
		name: 'Blaze',
		icon: 'https://xivapi.com//i/003000/003345.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MUSTARD_BOMB: {
		id: 23279,
		name: 'Mustard Bomb',
		icon: 'https://xivapi.com//i/003000/003346.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: ASTRAL,
		statusesApplied: ['INCENDIARY_BURNS'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DRAGON_FORCE: {
		id: 23280,
		name: 'Dragon Force',
		icon: 'https://xivapi.com//i/003000/003347.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 120000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.MATRA_MAGIC,
		statusesApplied: ['DRAGON_FORCE'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	AETHERIAL_SPARK: {
		id: 23281,
		name: 'Aetherial Spark',
		icon: 'https://xivapi.com//i/003000/003348.png',
		onGcd: true,
		castTime: 2000,
		statusesApplied: ['BLEEDING'],
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	HYDRO_PULL: {
		id: 23282,
		name: 'Hydro Pull',
		icon: 'https://xivapi.com//i/003000/003349.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MALEDICTION_OF_WATER: {
		id: 23283,
		name: 'Malediction of Water',
		icon: 'https://xivapi.com//i/003000/003350.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	CHOCO_METEOR: {
		id: 23284,
		name: 'Choco Meteor',
		icon: 'https://xivapi.com//i/003000/003351.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MATRA_MAGIC: {
		id: 23285,
		name: 'Matra Magic',
		icon: 'https://xivapi.com//i/003000/003352.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 120000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.MATRA_MAGIC,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	PERIPHERAL_SYNTHESIS: {
		id: 23286,
		name: 'Peripheral Synthesis',
		icon: 'https://xivapi.com//i/003000/003353.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		statusesApplied: ['LIGHTHEADED'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BOTH_ENDS: {
		id: 23287,
		name: 'Both Ends',
		icon: 'https://xivapi.com//i/003000/003354.png',
		cooldown: 120000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.NIGHTBLOOM,
		damageType: MAGICAL,
	},
	PHANTOM_FLURRY: {
		id: 23288,
		name: 'Phantom Flurry',
		icon: 'https://xivapi.com//i/003000/003355.png',
		gcdRecast: 2500,
		cooldown: 120000,
		onGcd: true, // not actually true but makes the timeline nicer
		statusesApplied: ['PHANTOM_FLURRY'],
		damageType: MAGICAL,
	},
	PHANTOM_FLURRY_KICK: { // This is what Phantom Flurry turns into while the effect is channeling
		// Even though this is a GCD, it is NOT affected by Spell Speed; it always rolls for 2.5s
		id: 23289,
		name: 'Phantom Flurry',
		icon: 'https://xivapi.com//i/003000/003356.png',
		gcdRecast: 2500,
		onGcd: true,
		damageType: MAGICAL,
	},
	NIGHTBLOOM: {
		id: 23290,
		name: 'Nightbloom',
		icon: 'https://xivapi.com//i/003000/003357.png',
		cooldown: 120000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.NIGHTBLOOM,
		statusesApplied: ['BLEEDING'],
		damageType: MAGICAL,
	},
	GOBLIN_PUNCH: {
		id: 34563,
		name: 'Goblin Punch',
		icon: 'https://xivapi.com/i/003000/003358.png',
		onGcd: true,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	RIGHT_ROUND: {
		id: 34564,
		name: 'Right Round',
		icon: 'https://xivapi.com/i/003000/003359.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SCHILTRON: {
		id: 34565,
		name: 'Schiltron',
		icon: 'https://xivapi.com/i/003000/003360.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		statusesApplied: ['SCHILTRON'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	REHYDRATION: {
		id: 34566,
		name: 'Rehydration',
		icon: 'https://xivapi.com/i/003000/003361.png',
		onGcd: true,
		castTime: 5000,
		gcdRecast: 2500,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	BREATH_OF_MAGIC: {
		id: 34567,
		name: 'Breath of Magic',
		icon: 'https://xivapi.com/i/003000/003362.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		statusesApplied: ['BREATH_OF_MAGIC'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	WILD_RAGE: {
		id: 34568,
		name: 'Wild Rage',
		icon: 'https://xivapi.com/i/003000/003363.png',
		onGcd: true,
		castTime: 5000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	PEAT_PELT: {
		id: 34569,
		name: 'Peat Pelt',
		icon: 'https://xivapi.com/i/003000/003364.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: UMBRAL,
		statusesApplied: ['BEGRIMED'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DEEP_CLEAN: {
		id: 34570,
		name: 'Deep Clean',
		icon: 'https://xivapi.com/i/003000/003365.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: PHYSICAL,
		statusesApplied: ['SPICK_AND_SPAN'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	RUBY_DYNAMICS: {
		id: 34571,
		name: 'Ruby Dynamics',
		icon: 'https://xivapi.com/i/003000/003366.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 30000,
		cooldownGroup: BLU_COOLDOWN_GROUPS.THE_ROSE_OF_DESTRUCTION,
		damageType: PHYSICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DIVINATION_RUNE: {
		id: 34572,
		name: 'Divination Rune',
		icon: 'https://xivapi.com/i/003000/003367.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	DIMENSIONAL_SHIFT: {
		id: 34573,
		name: 'Dimensional Shift',
		icon: 'https://xivapi.com/i/003000/003368.png',
		onGcd: true,
		castTime: 5000,
		gcdRecast: 2500,
		damageType: DARK,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	CONVICTION_MARCATO: {
		id: 34574,
		name: 'Conviction Marcato',
		icon: 'https://xivapi.com/i/003000/003369.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	FORCE_FIELD: {
		id: 34575,
		name: 'Force Field',
		icon: 'https://xivapi.com/i/003000/003370.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 120000,
		statusesApplied: ['BLU_PHYSICAL_VULN_DOWN', 'BLU_MAGIC_VULN_DOWN'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	WINGED_REPROBATION: {
		// NOTE: This spell handles cooldowns in a very unusual way;
		// see the WingedReprobation module for details.
		id: 34576,
		name: 'Winged Reprobation',
		icon: 'https://xivapi.com/i/003000/003371.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		cooldown: 120000,
		damageType: PHYSICAL,
		statusesApplied: ['WINGED_REPROBATION', 'WINGED_REDEMPTION'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	LASER_EYE: {
		id: 34577,
		name: 'Laser Eye',
		icon: 'https://xivapi.com/i/003000/003372.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	CANDY_CANE: {
		id: 34578,
		name: 'Candy Cane',
		icon: 'https://xivapi.com/i/003000/003373.png',
		onGcd: true,
		castTime: 1000,
		cooldown: 90000,
		gcdRecast: 2500,
		statusesApplied: ['CANDY_CANE'],
		cooldownGroup: BLU_COOLDOWN_GROUPS.MAGIC_HAMMER,
		damageType: MAGICAL,
		speedAttribute: Attribute.SPELL_SPEED,
	},
	MORTAL_FLAME: {
		id: 34579,
		name: 'Mortal Flame',
		icon: 'https://xivapi.com/i/003000/003374.png',
		onGcd: true,
		castTime: 2000,
		gcdRecast: 2500,
		damageType: MAGICAL,
		elementType: ASTRAL,
		statusesApplied: ['MORTAL_FLAME'],
		speedAttribute: Attribute.SPELL_SPEED,
	},
	SEA_SHANTY: {
		id: 34580,
		name: 'Sea Shanty',
		icon: 'https://xivapi.com/i/003000/003375.png',
		cooldown: 120000,
		damageType: MAGICAL,
		elementType: UMBRAL,
	},
	APOKALYPSIS: {
		id: 34581,
		name: 'Apokalypsis',
		icon: 'https://xivapi.com/i/003000/003376.png',
		cooldown: 120000,
		damageType: MAGICAL,
		onGcd: true, // same justification as with Phantom Flurry
		statusesApplied: ['APOKALYPSIS'],
		cooldownGroup: BLU_COOLDOWN_GROUPS.BEING_MORTAL,
	},
	BEING_MORTAL: {
		id: 34582,
		name: 'Being Mortal',
		icon: 'https://xivapi.com/i/003000/003377.png',
		cooldown: 120000,
		damageType: MAGICAL,
		cooldownGroup: BLU_COOLDOWN_GROUPS.BEING_MORTAL,
	},
})
