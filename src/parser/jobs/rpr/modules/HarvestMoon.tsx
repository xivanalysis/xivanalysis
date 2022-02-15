import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Window, Invulnerability} from 'parser/core/modules/Invulnerability'
import {UnableToAct} from 'parser/core/modules/UnableToAct'
import React from 'react'

const SOULSOW_BUFFER = 1000

export class HarvestMoon extends Analyser {
	static override handle = 'harvestMoon'

	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private invulnerability!: Invulnerability
	@dependency private unableToAct!: UnableToAct

	private harvestMoonCasts = 0
	private ADJUSTED_CAST = this.data.actions.SOULSOW.castTime + SOULSOW_BUFFER

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.type('action')
				.action(this.data.actions.HARVEST_MOON.id),
			() => this.harvestMoonCasts++)

		this.addEventHook('complete', this.onComplete)
	}

	private getExpectedUses(): number {
		return this.invulWindows()
			.filter(this.canChargeMoon.bind(this))
			.length + 1
	}

	private invulWindows(): Window[] {
		return this.invulnerability.getWindows().filter(this.longerThanChargeTime.bind(this))
	}

	private canChargeMoon(invulWindow: Window): boolean {
		return this.unableToActWindows(invulWindow)
			.reduce(this.toActableWindows, [] as Window[])
			.some(this.longerThanChargeTime.bind(this))
	}

	// Reduce function for calculating interstitial windows that assumes that there are at least 2 windows.
	private toActableWindows(acc: Window[], window: Window, idx: number, arr: Window[]): Window[] {
		if (idx === arr.length - 1) {
			return acc
		}
		return acc.concat({
			start: window.end,
			end: arr[idx + 1].start,
		})
	}

	// Creates dummy windows at the beginning and end of the invulWindow if needed
	// to calculate the actable Windows. Guarantees at least 2 windows.
	private unableToActWindows(invulWindow: Window): Window[] {
		const unactableWindows = this.unableToAct.getWindows(invulWindow) as Window[]
		if (unactableWindows.length === 0 || unactableWindows[0].start > invulWindow.start) {
			unactableWindows.unshift(this.dummyWindow(invulWindow.start))
		}
		if (unactableWindows[unactableWindows.length - 1].end < invulWindow.end) {
			unactableWindows.push(this.dummyWindow(invulWindow.end))
		}
		return unactableWindows
	}

	private dummyWindow(time: number): Window {
		return {start: time, end: time}
	}

	private longerThanChargeTime(window: Window): boolean {
		return window.end - window.start >= this.ADJUSTED_CAST
	}

	private getUsedPercentage(expectedUses: number): string {
		return (this.harvestMoonCasts / expectedUses * 100).toFixed(2)
	}

	private onComplete() {
		const expectedUses = this.getExpectedUses()
		const hmUsesPercent = this.getUsedPercentage(expectedUses)

		this.checklist.add(new Rule({
			name: <Trans id="rpr.harvestmoon.checklist.title">
				Use <DataLink action="SOULSOW" /> during downtime.
			</Trans>,
			description: <Trans id="rpr.harvestmoon.checklist.description">
				Harvest Moon is one of your highest potency abilities. Aim to get at least one use each time the boss is targetable.
			</Trans>,
			requirements: [
				new Requirement({
					name: <Trans id="rpr.harvestmoon.checklist.requirement.name">
						<DataLink action="HARVEST_MOON" /> uses
					</Trans>,
					overrideDisplay: `${this.harvestMoonCasts} / ${expectedUses} (${hmUsesPercent}%)`,
					percent: hmUsesPercent,
				}),
			],
			target: 100,
		}))
	}
}
