import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable, RotationTableEntry} from 'components/ui/RotationTable'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {History} from 'parser/core/modules/ActionWindow/History'
import {Actor, Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {TieredSuggestion, SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Icon} from 'semantic-ui-react'

const PLAYERS_HIT_TARGET = 8
const PLAYERS_HIT_SUGGESTION_THRESHOLD = 7
const MAX_BUFF_DURATION = 30000
const PLAYERS_MISSED_SEVERITY = {
	1: SEVERITY.MINOR,
	4: SEVERITY.MEDIUM,
	8: SEVERITY.MAJOR,
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

interface SearingLightUsage {
	playersHit: Set<string>
	events: Array<Events['action']>
	ghosted: boolean
}

// Currently, Searing Light will drift relative to the rotation in order to keep demis on cooldown.
// If this changes, it may make sense to convert this to a BuffWindow and call out expected skills.

export class SearingLight extends Analyser {
	static override handle = 'searinglight'
	static override title = t('smn.searinglight.title')`Searing Light`

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline

	private history = new History<SearingLightUsage>(
		() => { return {playersHit: new Set<string>(), events: [], ghosted: false} }
	)
	private players: Actor[] = []
	private playerCastHook? : EventHook<Events['action']>
	private slPending: number = 0 // timestamp

	override initialise() {
		super.initialise()

		const pets = this.parser.pull.actors
			.filter(actor => actor.owner === this.parser.actor)
			.map(actor => actor.id)
		const petsFilter = filter<Event>()
			.source(oneOf(pets))

		this.addEventHook(
			petsFilter.action(this.data.actions.PET_SEARING_LIGHT.id).type('action'),
			this.onPetCast
		)

		this.addEventHook(
			petsFilter.status(this.data.statuses.SEARING_LIGHT.id).type('statusApply'),
			this.countTargets
		)
		this.addEventHook(
			filter<Event>()
				.target(this.parser.actor.id)
				.status(this.data.statuses.SEARING_LIGHT.id)
				.type('statusRemove'),
			this.onBuffRemoved
		)

		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(this.data.actions.SEARING_LIGHT.id)
				.type('action'),
			this.queueSearingLight)
		this.addEventHook(
			petsFilter.action(this.data.matchActionId(OTHER_PET_ACTIONS)).type('action'),
			this.nonCarbuncleAction,
		)

		this.players = this.actors.friends.filter(actor => actor.playerControlled)

		this.addEventHook('complete', this.onComplete)
	}

	private hookPlayerCasts() {
		if (this.playerCastHook == null) {
			this.playerCastHook = this.addEventHook(filter<Event>().source(this.parser.actor.id).type('action'), this.onPlayerCast)
		}
	}
	private unhookPlayerCasts() {
		if (this.playerCastHook != null) {
			this.removeEventHook(this.playerCastHook)
			this.playerCastHook = undefined
		}
	}
	private onPlayerCast(event: Events['action']) {
		const action = this.data.getAction(event.action)
		if (action?.autoAttack) { return }

		this.history.doIfOpen(current => {
			if (this.actors.current.hasStatus(this.data.statuses.SEARING_LIGHT.id)) {
				current.events.push(event)
			}
		})
	}

	private onPetCast(event: Events['action']) {
		// If there is no active window, open one.
		// This method can get called multiple times for what should
		// be the same window due to pet action duping, so reuse the
		// window in that case.
		// If the active window is old enough that it should have closed
		// but didn't for some reason, close it and open a new one.

		this.hookPlayerCasts()
		const current = this.history.getCurrentOrOpenNew(event.timestamp)
		if (current.start + MAX_BUFF_DURATION < event.timestamp) {
			this.history.openNew(event.timestamp)
		}
		this.slPending = 0
	}

	private countTargets(event: Events['statusApply']) {
		this.history.doIfOpen(current => {
			if (this.players.findIndex(player => player.id === event.target) >= 0) {
				current.playersHit = current.playersHit.add(event.target)
			}
		})
	}

	private onBuffRemoved(event: Events['statusRemove']) {
		this.history.closeCurrent(event.timestamp)
		this.unhookPlayerCasts()
	}

	private queueSearingLight(event: Events['action']) {
		this.slPending = event.timestamp
	}

	private nonCarbuncleAction(event: Events['action']) {
		if (this.slPending === 0) { return }

		const window = this.history.openNew(this.slPending)
		window.data.ghosted = true
		this.history.closeCurrent(event.timestamp)

		this.slPending = 0
	}

	private onComplete() {
		this.history.closeCurrent(this.parser.pull.timestamp + this.parser.pull.duration)

		if (this.history.entries.length === 0) { return }

		const missedPlayersWindows = this.history.entries
			.filter(slUse => slUse.data.playersHit.size <= PLAYERS_HIT_SUGGESTION_THRESHOLD)
			.length
		const totalMissedPlayers = this.history.entries
			.reduce((totalMissed, slUse) => {
				return totalMissed + ((slUse.data.ghosted) ? 0 :  PLAYERS_HIT_TARGET - slUse.data.playersHit.size)
			}, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.SEARING_LIGHT.icon,
			content: <Trans id="smn.searinglight.suggestions.missed-players.content">
				Try to make sure your <StatusLink status="SEARING_LIGHT"/> casts buff your full party with each use. Failing to do so is a raid damage loss.
			</Trans>,
			tiers: PLAYERS_MISSED_SEVERITY,
			value: totalMissedPlayers,
			why: <Trans id="smn.searinglight.suggestions.missed-players.why">
				{missedPlayersWindows} of your Searing Light uses did not buff the full party.
			</Trans>,
		}))

		const ghostedWindows = this.history.entries.filter(slUse => slUse.data.ghosted).length
		if (ghostedWindows) {
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
	}

	override output() {
		const anyGhosted = this.history.entries.some(slUse => slUse.data.ghosted)

		const rotationData = this.history.entries
			.map(slUse => {
				const targetsData = {
					players: {
						actual: slUse.data.playersHit.size,
						expected: PLAYERS_HIT_TARGET,
					},
				}
				const notesMap = {
					executed: this.getNotesIcon(slUse.data.ghosted),
				}
				const windowStart = slUse.start - this.parser.pull.timestamp
				const windowEnd = slUse.end ?? (this.parser.pull.timestamp + this.parser.pull.duration)
				const ret: RotationTableEntry = {
					start: windowStart,
					end: windowEnd,
					rotation: slUse.data.events,
					targetsData,
					notesMap,
				}
				return ret
			})
		const rotationTargets = [{
			header: <Trans id="smn.searinglight.players-count">Players Buffed</Trans>,
			accessor: 'players',
		}]
		// only show the ghosting related column if there is a ghost
		const rotationNotes = anyGhosted ?
			[{
				header: <Trans id="smn.searinglight.executed">Cast by carbuncle</Trans>,
				accessor: 'executed',
			}] :
			[]
		return <RotationTable
			targets={rotationTargets}
			notes={rotationNotes}
			data={rotationData}
			onGoto={this.timeline.show}
			headerTitle={<Trans id="smn.searinglight.table-header">Searing Light Actions</Trans>}
		/>
	}

	private getNotesIcon(ruleFailed: boolean) {
		return <Icon
			name={ruleFailed ? 'remove' : 'checkmark'}
			className={ruleFailed ? 'text-error' : 'text-success'}
		/>
	}
}