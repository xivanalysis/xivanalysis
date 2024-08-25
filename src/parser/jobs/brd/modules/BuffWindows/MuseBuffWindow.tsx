import {Trans} from '@lingui/react'
import _ from 'lodash'
import React from 'react'
import {ActionLink, DataLink} from '../../../../../components/ui/DbLink'
import {Action} from '../../../../../data/ACTIONS'
import {Status} from '../../../../../data/STATUSES'
import {Event, Events} from '../../../../../event'
import {isDefined} from '../../../../../utilities'
import {filter} from '../../../../core/filter'
import {dependency} from '../../../../core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedGcdCountEvaluator} from '../../../../core/modules/ActionWindow'
import {HistoryEntry} from '../../../../core/modules/ActionWindow/History'
import {GlobalCooldown} from '../../../../core/modules/GlobalCooldown'
import {SEVERITY} from '../../../../core/modules/Suggestions'
import {DEBUG_SHOW_WINDOWS} from './Constants'

interface MuseWindow {
	start: number,
	end?: number | undefined,
}

export abstract class MuseBuffWindow extends BuffWindow {
	@dependency globalCooldown!: GlobalCooldown

	private museHistory: MuseWindow[] = []

	abstract override buffStatus: Status
	abstract action: Action

	override initialise() {
		super.initialise()

		const suggestionIcon = this.action.icon
		const suggestionContent = <Trans id="brd.buffwindow.suggestions.missedgcd.content">
			Try to land at least 8 GCDs (9 GCDs with <DataLink status="ARMYS_MUSE"/>) during every <ActionLink {...this.action} /> window.
		</Trans>
		const suggestionWindowName = <ActionLink {...this.action} showIcon={false}/>

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const buffFilter = playerFilter.status(this.data.statuses.ARMYS_MUSE.id)
		this.addEventHook(buffFilter.type('statusApply'), this.onApplyMuse)
		this.addEventHook(buffFilter.type('statusRemove'), this.onRemoveMuse)

		const evaluator = new ExpectedGcdCountEvaluator({
			expectedGcds: 8,
			globalCooldown: this.globalCooldown,
			hasStacks: false,
			suggestionIcon,
			suggestionContent,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			adjustCount: this.adjustMuseGcdCount.bind(this),
		})

		this.addEvaluator(evaluator)

		this.setHistoryOutputFilter((window) => evaluator.isWindowMissingGcds(window) || DEBUG_SHOW_WINDOWS)
	}

	private get activeMuse(): MuseWindow | undefined {
		const last = _.last(this.museHistory)
		if (last && !isDefined(last.end)) {
			return last
		}
		return undefined
	}

	private onApplyMuse(event: Events['statusApply']) {
		this.museHistory.push({start: event.timestamp})
	}

	private onRemoveMuse(event: Events['statusRemove']) {
		if (this.activeMuse) {
			this.activeMuse.end = event.timestamp
		}
	}

	private adjustMuseGcdCount(window: HistoryEntry<EvaluatedAction[]>) {
		// Ignore muse if end of fight
		// TODO: better end of fight handling (can make it scale with % of GCDs in muse)
		if (this.isRushedEndOfPullWindow(window)) {
			return 0
		}

		// Check if muse was up for at least 3 GCDs in this buffWindow
		const museOverlap = this.museHistory.some(muse => (
			window.data.filter(event => this.data.getAction(event.action.id)?.onGcd &&
				event.timestamp > muse.start && (!muse.end || event.timestamp < muse.end))
				.length >= 1
		))

		return museOverlap ? 1 : 0
	}
}
