import {AbilityEvent, Event} from 'fflogs'
import Module from 'parser/core/Module'
import Enemies from './Enemies'
import {FFLogsEventNormaliser} from './FFLogsEventNormaliser'
import PrecastAction from './PrecastAction'
import PrecastStatus from './PrecastStatus'

interface Hit {
	id: number
	instance: number
	times: number
	amount: number
}

export interface AoeEvent extends AbilityEvent {
	hits: Hit[]
	sourceID: number
	successfulHit: boolean
}

export default class AoE extends Module {
	protected precastAction: PrecastAction
	protected precastStatus: PrecastStatus
	protected enemies: Enemies
	protected fflogsEvents: FFLogsEventNormaliser

	isValidHit(event: Event): boolean
}
