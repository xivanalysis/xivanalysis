/* eslint-disable no-magic-numbers */

export const PARTYWIDE_SPEED_BUFF_FLAGS = {
	NONE: 0,
}
const FLAGS = PARTYWIDE_SPEED_BUFF_FLAGS

export const PARTYWIDE_SPEED_BUFF_TO_FLAG_MAP = {}

// Map combinations of {jobSpeedBuff} and arrow/feyWind, based on https://docs.google.com/spreadsheets/d/1JZE94VgMhXrPeoxJOrL8z6LTcxcpYS8so5wLBnhPeLw/
// Uncomment entries when buff statuses are added or generated
export const getJobSpeedBuffToSpeedmodMap = data => ({
// export const JOB_SPEED_BUFF_TO_SPEEDMOD_MAP = {
	0: {
		[FLAGS.NONE]: 100,
	},
	[data.statuses.CIRCLE_OF_POWER.id]: {
		[FLAGS.NONE]: 85,
	},
	[data.statuses.PRESENCE_OF_MIND.id]: {
		[FLAGS.NONE]: 80,
	},
	[data.statuses.GREASED_LIGHTNING.id]: {
		[FLAGS.NONE]: 80,
	},
	[data.statuses.SHIFU.id]: {
		[FLAGS.NONE]: 87,
	},
	//	[data.statuses.ARMYS_PAEON_I.id]: {
	//		[FLAGS.NONE]: 96,
	//	},
	//	[data.statuses.ARMYS_PAEON_II.id]: {
	//		[FLAGS.NONE]: 92,
	//	},
	//	[data.statuses.ARMYS_PAEON_III.id]: {
	//		[FLAGS.NONE]: 88,
	//	},
	//	[data.statuses.ARMYS_PAEON_IV.id]: {
	//		[FLAGS.NONE]: 84,
	//	},
	//	[data.statuses.HUTON.id]: {
	//		[FLAGS.NONE]: 85,
	//	},
})
