import {ReactNode} from 'react'
import {matchClosestLower} from 'utilities'

export const SEVERITY = {
	// NOTE: Don't use MORBID, It's for deaths. I _will_ block the PRs on this.
	MORBID: 0,
	MAJOR: 1,
	MEDIUM: 2,
	MINOR: 3,
	// Also don't use this for real suggestions, tis but a meme
	MEMES: 100,
	// The matchClosest fall back to undefined, so let's use that for ignore too
	IGNORE: undefined,
}
type Severity = typeof SEVERITY[keyof typeof SEVERITY]

export interface SuggestionOptions {
	icon: string
	content: ReactNode
	why: ReactNode
	severity: number
}

export default class Suggestion {
	public icon: string // TODO: default image
	public content: ReactNode
	public why: ReactNode
	private severityValue: Severity

	constructor(options: SuggestionOptions) {
		this.icon = options.icon
		this.content = options.content
		this.why = options.why
		this.severityValue = options.severity
	}

	get severity(): Severity {
		return this.severityValue
	}

	set severity(value) {
		this.severityValue = value ?? SEVERITY.MEDIUM
	}
}

export interface SeverityTiers {
	[key: number]: Severity
}

export interface TieredSuggestionOptions {
	icon: string
	content: ReactNode
	why: ReactNode
	tiers: SeverityTiers
	value: number
	matcher?: (tiers: SeverityTiers, value: number) => Severity
}

export class TieredSuggestion extends Suggestion {
	public tiers: SeverityTiers
	public value: number
	public matcher: (tiers: SeverityTiers, value: number) => Severity

	constructor(options: TieredSuggestionOptions) {
		super({...options, severity: SEVERITY.MINOR})

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
