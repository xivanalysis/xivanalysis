import {ActionRoot} from 'data/ACTIONS/root'
import {StatusRoot} from 'data/STATUSES'
//this module is used to store all delayed attacks/dots relevant for card plays
//only actions are tracked here as the related statuses can be looked up using statusesApplied

export const DOTS_ALIAS: [[keyof StatusRoot, keyof StatusRoot]] = [
	//these dots are tracked via other statuses rather than the original afflicted status. each with their own reasoning below

	//MCH wildfire is reapplied with each weaponskill applied. much easier to just track the wildfire status on self for this purpose
	['WILDFIRE', 'WILDFIRE_SELF'],
]

export const DOTS_AND_GROUND_ACTIONS: Array<keyof ActionRoot> = [

	//**MELEE**
	//DRG
	'CHAOS_THRUST',
	'CHAOTIC_SPRING',

	//NIN
	'DOTON',
	'DOTON_TCJ',

	//RPR
	//none for RPR. Comment left here as reminder to review in future patches

	//MNK
	'DEMOLISH',

	//SAM
	'HIGANBANA',
	'KAESHI_HIGANBANA',

	//**PHYS RANGED**
	//BRD
	'VENOMOUS_BITE',
	'WINDBITE',
	'IRON_JAWS',
	'CAUSTIC_BITE',
	'STORMBITE',

	//MCH
	'FLAMETHROWER',
	'BIOBLASTER',
	'WILDFIRE',

	//DNC
	//none for DNC. Comment left here as reminder to review in future patches

	//**MAG RANGED except BLU**
	//BLM
	'THUNDER',
	'THUNDER_II',
	'THUNDER_III',
	'THUNDER_IV',

	//RDM
	//none for RDM. Comment left here as reminder to review in future patches

	//SMN
	'SLIPSTREAM',

	//**TANK**
	//PLD
	'CIRCLE_OF_SCORN',
	'GORING_BLADE',
	'BLADE_OF_VALOR',

	//GNB
	'SONIC_BREAK',
	'BOW_SHOCK',

	//DRK
	'SALTED_EARTH',

	//WAR
	//none for WAR. Comment left here as reminder to review in future patches

	//**HEALER**
	//AST
	'COMBUST_II',
	'COMBUST_III',

	//WHM
	'DIA',
	'AERO',
	'AERO_II',
	'AERO_III',

	//SGE
	'EUKRASIAN_DOSIS',
	'EUKRASIAN_DOSIS_II',
	'EUKRASIAN_DOSIS_III',

	//SCH
	'BIOLYSIS',

]

export const SPECIAL_STATUS: Array<keyof StatusRoot> = [
	//war vengeance uses damage buffs at the time of preparation, not the time vengeance is cast
	'VENGEANCE',
]
