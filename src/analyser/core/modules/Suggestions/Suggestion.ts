import React from 'react'
import {matchClosestLower} from 'utilities'

export enum Severity {
	/** Exlusively for deaths. Do not use, I _will_ reject PRs that use this. */
	MORBID,
	MAJOR,
	MEDIUM,
	MINOR,
}

export class Suggestion {
	// default "cure" icon
	icon: string = 'https://xivapi.com/i/000000/000405.png'
	content: React.ReactNode
	why: React.ReactNode
	severity?: Severity

	constructor(opts: {
		icon?: string,
		content: React.ReactNode,
		why: React.ReactNode,
		severity?: Severity,
	}) {
		opts.icon && (this.icon = opts.icon)
		this.content = opts.content
		this.why = opts.why
		this.severity = opts.severity
	}
}

export class TieredSuggestion extends Suggestion {
	constructor(opts: {
		icon?: string,
		content: React.ReactNode,
		why: React.ReactNode,
		value: number,
		tiers: Record<number, Severity>,
		matcher?: (values: Record<number, Severity>, value: number) => number | undefined,
	}) {
		const matcher = opts.matcher || matchClosestLower
		super({
			...opts,
			severity: matcher(opts.tiers, opts.value),
		})
	}
}
