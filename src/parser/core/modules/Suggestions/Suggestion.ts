import {ReactNode} from 'react'
import {matchClosestLower} from 'utilities'

export const SEVERITY = {
	// NOTE: Don't use MORBID, It's for deaths. I _will_ block the PRs on this.
	MORBID: 0,
	MAJOR: 1,
	MEDIUM: 2,
	MINOR: 3,
	// The matchClosest fall back to undefined, so let's use that for ignore too
	IGNORE: undefined,
}

export interface SuggestionOptions {
	icon: string
	content: ReactNode
	why: ReactNode
	severity?: number
}

export default class Suggestion {
	public icon: string // TODO: default image
	public content: ReactNode
	public why: ReactNode
	private severityValue?: number

	constructor(options: SuggestionOptions) {
		this.icon = options.icon
		this.content = options.content
		this.why = options.why
		// This gets a default even though it is number | undefined.
		// The undefined option is for TieredSuggestions to be able
		// to return SEVERITY.IGNORED.
		this.severityValue = options.severity ?? SEVERITY.MEDIUM
	}

	get severity() {
		return this.severityValue
	}

	set severity(value) {
		this.severityValue = value
	}
}

export interface SeverityTiers {
	[key: number]: number
}

export interface TieredSuggestionOptions {
	icon: string
	content: ReactNode
	why: ReactNode
	tiers: SeverityTiers
	value: number
	matcher?: (tiers: SeverityTiers, value: number) => number | undefined
}

export class TieredSuggestion extends Suggestion {
	public tiers: SeverityTiers
	public value: number
	public matcher: (tiers: SeverityTiers, value: number) => number | undefined

	constructor(options: TieredSuggestionOptions) {
		super(options)

		this.tiers = options.tiers
		this.value = options.value
		this.matcher = options.matcher ?? matchClosestLower
	}

	override get severity() {
		return this.matcher(this.tiers, this.value)
	}

	// noop setter so it doesn't die from the base class
	override set severity(value) { /* noop */ }
}
