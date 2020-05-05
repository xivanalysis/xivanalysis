import {Action} from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import Module from 'parser/core/Module'
import CastTime from './CastTime'
import {Data} from './Data'
import GlobalCooldown from './GlobalCooldown'
import {Invulnerability} from './Invulnerability'
import Speedmod from './Speedmod'
import Suggestions from './Suggestions'

// TODO: Refactor such that this isn't required
interface JankFakeEvent {
	type: undefined
	timestamp: number
}

interface SeverityTiers {
	[key: number]: number
}

export interface WeaveInfo {
	leadingGcdEvent: CastEvent | JankFakeEvent
	trailingGcdEvent: CastEvent
	gcdTimeDiff: number
	weaves: CastEvent[]
}

export default class Weaving extends Module {
	protected castTime: CastTime
	protected data: Data
	protected gcd: GlobalCooldown
	protected invuln: Invulnerability
	protected speedmod: Speedmod
	protected suggestions: Suggestions

	protected suggestionIcon: string
	protected suggestionContent: JSX.Element
	protected severity: SeverityTiers

	isOgcd(action: Action): boolean
	isBadWeave(weave: WeaveInfo, maxWeaves?: number): boolean
}
