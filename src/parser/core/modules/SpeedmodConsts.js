/* eslint-disable no-magic-numbers */

export const PARTYWIDE_SPEED_BUFF_FLAGS = {
	NONE: 0,
	FEY_WIND: 1,

}
const FLAGS = PARTYWIDE_SPEED_BUFF_FLAGS

export const PARTYWIDE_SPEED_BUFF_TO_FLAG_MAP = {}

// Map combinations of {jobSpeedBuff} and arrow/feyWind, based on https://docs.google.com/spreadsheets/d/1JZE94VgMhXrPeoxJOrL8z6LTcxcpYS8so5wLBnhPeLw/
// Uncomment entries when buff statuses are added or generated
export const getJobSpeedBuffToSpeedmodMap = data => ({
// export const JOB_SPEED_BUFF_TO_SPEEDMOD_MAP = {
	0: {
		[FLAGS.NONE]: 100,
		[FLAGS.FEY_WIND]: 97,
	},
	[data.statuses.CIRCLE_OF_POWER.id]: {
		[FLAGS.NONE]: 85,
		[FLAGS.FEY_WIND]: 82,
	},
	[data.statuses.PRESENCE_OF_MIND.id]: {
		[FLAGS.NONE]: 80,
		[FLAGS.FEY_WIND]: 77,
	},
	[data.statuses.GREASED_LIGHTNING.id]: {
		[FLAGS.NONE]: 95,
	},
	[data.statuses.GREASED_LIGHTNING_II.id]: {
		[FLAGS.NONE]: 90,
	},
	[data.statuses.GREASED_LIGHTNING_III.id]: {
		[FLAGS.NONE]: 85,
	},
	[data.statuses.GREASED_LIGHTNING_IV.id]: {
		[FLAGS.NONE]: 80,
	},
	[data.statuses.SHIFU.id]: {
		[FLAGS.NONE]: 87,
		[FLAGS.FEY_WIND]: 87,
	},
	//	[data.statuses.ARMYS_PAEON_I.id]: {
	//		[FLAGS.NONE]: 96,
	//		[FLAGS.FEY_WIND]: 94,
	//		[FLAGS.ARROW_5]: 92,
	//		[FLAGS.ARROW_10]: 87,
	//		[FLAGS.ARROW_15]: 82,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_5]: 89,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_10]: 84,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_15]: 79,
	//	},
	//	[data.statuses.ARMYS_PAEON_II.id]: {
	//		[FLAGS.NONE]: 92,
	//		[FLAGS.FEY_WIND]: 90,
	//		[FLAGS.ARROW_5]: 88,
	//		[FLAGS.ARROW_10]: 83,
	//		[FLAGS.ARROW_15]: 79,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_5]: 85,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_10]: 81,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_15]: 76,
	//	},
	//	[data.statuses.ARMYS_PAEON_III.id]: {
	//		[FLAGS.NONE]: 88,
	//		[FLAGS.FEY_WIND]: 86,
	//		[FLAGS.ARROW_5]: 84,
	//		[FLAGS.ARROW_10]: 80,
	//		[FLAGS.ARROW_15]: 75,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_5]: 81,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_10]: 77,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_15]: 73,
	//	},
	//	[data.statuses.ARMYS_PAEON_IV.id]: {
	//		[FLAGS.NONE]: 84,
	//		[FLAGS.FEY_WIND]: 82,
	//		[FLAGS.ARROW_5]: 80,
	//		[FLAGS.ARROW_10]: 76,
	//		[FLAGS.ARROW_15]: 72,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_5]: 78,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_10]: 74,
	//		[FLAGS.FEY_WIND|FLAGS.ARROW_15]: 69,
	//	},
	[data.statuses.BLOOD_WEAPON.id]: {
		[FLAGS.NONE]: 90,
		[FLAGS.FEY_WIND]: 87,
	},
//	[data.statuses.HUTON.id]: {
//		[FLAGS.NONE]: 85,
//		[FLAGS.FEY_WIND]: 83,
//		[FLAGS.ARROW_5]: 81,
//		[FLAGS.ARROW_10]: 77,
//		[FLAGS.ARROW_15]: 73,
//		[FLAGS.FEY_WIND|FLAGS.ARROW_5]: 79,
//		[FLAGS.FEY_WIND|FLAGS.ARROW_10]: 74,
//		[FLAGS.FEY_WIND|FLAGS.ARROW_15]: 70,
//	},
})
