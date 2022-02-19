import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter, oneOf} from 'parser/core/filter'
import {RaidBuffWindow, EvaluatedAction, EvaluationOutput, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Icon} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

class GhostSearingEvaluator implements WindowEvaluator {
	private ghostTimestamps: number[] = []
	constructor(ghostTimestamps: number[]) {
		this.ghostTimestamps = ghostTimestamps
	}

	public suggest() { return undefined }

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | undefined {
		if (this.ghostTimestamps.length === 0) {
			return
		}
		const ghosted = windows.map(w => this.ghostTimestamps.some(timestamp => this.isInWindow(w, timestamp)))
		return {
			format: 'notes',
			header: {
				header: <Trans id="smn.searinglight.executed">Cast by carbuncle</Trans>,
				accessor: 'executed',
			},
			rows: ghosted.map(ghost => {
				return this.getNotesIcon(ghost)
			}),
		}
	}

	private isInWindow(window: HistoryEntry<EvaluatedAction[]>, timestamp: number) {
		return (window.start <= timestamp) && ((window.end ?? window.start) >= timestamp)
	}

	private getNotesIcon(ruleFailed: boolean) {
		return <Icon
			name={ruleFailed ? 'remove' : 'checkmark'}
			className={ruleFailed ? 'text-error' : 'text-success'}
		/>
	}
}

const OTHER_PET_ACTIONS: ActionKey[] = [
	'INFERNO',
	'EARTHEN_FURY',
	'AERIAL_BLAST',
	'WYRMWAVE',
	'AKH_MORN',
	'EVERLASTING_FLIGHT',
	'SCARLET_FLAME',
	'REVELATION',
]

// Currently, Searing Light will drift relative to the rotation in order to keep demis on cooldown.
// If it changes, this module can also call out expected skills.
export class SearingLight extends RaidBuffWindow {
	static override handle = 'searinglight'
	static override title = t('smn.searinglight.title')`Searing Light`
	static override displayOrder = DISPLAY_ORDER.SEARING_LIGHT

	override buffStatus = this.data.statuses.SEARING_LIGHT

	private ghostTimestamps = new Array<number>()
	private slPendingTimestamp?: number

	override initialise() {
		super.initialise()

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(this.data.actions.SEARING_LIGHT.id)
				.type('action'),
			this.queueSearingLight)
		const petIds = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)
		const petsFilter = filter<Event>()
			.source(oneOf(petIds))
		this.addEventHook(
			petsFilter.action(this.data.matchActionId(OTHER_PET_ACTIONS)).type('action'),
			this.onCarbuncleAction,
		)
		this.addEvaluator(new GhostSearingEvaluator(this.ghostTimestamps))
	}

	private queueSearingLight(event: Events['action']) {
		this.slPendingTimestamp = event.timestamp
	}

	// If the carbuncle does another action before Searing Light lands, it's
	// considered ghosted.

	private onCarbuncleAction(event: Events['action']) {
		if (this.slPendingTimestamp == null) { return }

		this.history.openNew(this.slPendingTimestamp)
		this.history.closeCurrent(event.timestamp)
		this.ghostTimestamps.push(this.slPendingTimestamp)
		this.slPendingTimestamp = undefined
	}

	// If Searing Light is applied, it's no longer pending, so the timestamp should be cleared.
	override startWindowAndTimeout(timestamp: number) {
		this.slPendingTimestamp = undefined
		super.startWindowAndTimeout(timestamp)
	}

	override onComplete() {
		const ghostedWindows = this.ghostTimestamps.length
		if (ghostedWindows > 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.SEARING_LIGHT.icon,
				content: <Trans id="smn.searinglight.suggestions.ghosted.content">
						Make sure carbuncle has enough time to cast <ActionLink action="PET_SEARING_LIGHT"/> before summoning an Arcanum or demi summon or your cast will be wasted.
				</Trans>,
				why: <Trans id="smn.searinglight.suggestiongs.ghosted.why">
					<Plural value={ghostedWindows} one="# Searing Light use was" other="# Searing Light uses were"/> lost.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}
		super.onComplete()
	}

	override playersBuffedSuggestion(windows: Array<HistoryEntry<EvaluatedAction[]>>): Suggestion | undefined {
		const missedWindows = windows
			.map(window => this.affectedPlayers(window))
			.map(affected => this.expectedCount - affected)
			.filter(missed => missed !== 0)

		const totalMissedPlayers = missedWindows.reduce((totalMissed, miss) => totalMissed + miss, 0)
		const missedPlayersWindows = missedWindows.length

		if (totalMissedPlayers > 0) {
			return (new Suggestion({
				icon: this.data.actions.SEARING_LIGHT.icon,
				content: <Trans id="smn.searinglight.suggestions.missed-players.content">
					Try to make sure your <StatusLink status="SEARING_LIGHT"/> casts buff your full party with each use. Failing to do so is a raid damage loss.
				</Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id="smn.searinglight.suggestions.missed-players.why">
					{missedPlayersWindows} of your Searing Light uses did not buff the full party.
				</Trans>,
			}))
		}
	}
}
