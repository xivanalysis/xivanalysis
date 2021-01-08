import {STATUS_ID_OFFSET} from 'data/STATUSES'
import {UNABLE_TO_ACT_STATUS_IDS} from 'generated/unableToActStatusIds'

export const STATUS_IDS = UNABLE_TO_ACT_STATUS_IDS.map(i => i+STATUS_ID_OFFSET)
