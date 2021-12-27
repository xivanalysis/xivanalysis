import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, EvaluationOutput, ExpectedGcdCountEvaluator, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const BL_GCD_TARGET = 6
const EXPECTED_PLAYER_COUNT = 8

const BL_DOUBLE_DRG_ERROR = {
	NONE: 0,
	THEY_OVERWROTE: 1,
	YOU_OVERWROTE: 2,
}

class PlayersBuffedEvaluator implements WindowEvaluator {
	private affectedPlayers: (window: HistoryEntry<EvaluatedAction[]>) => number

	constructor(affectedPlayers: (window: HistoryEntry<EvaluatedAction[]>) => number) {
		this.affectedPlayers = affectedPlayers
	}

	// this is purely informational
	public suggest() { return undefined }

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | undefined {
		const affected = windows.map(w => this.affectedPlayers(w))
		return {
			format: 'table',
			header: {
				header: <Trans id="drg.battlelitany.rotation-table.header.buffed">Players Buffed</Trans>,
				accessor: 'buffed',
			},
			rows: affected.map(a => {
				return {
					actual: a,
					expected: EXPECTED_PLAYER_COUNT,
				}
			}),
		}
	}
}

/**
 * so in theory, you don't have two dragoons in a party
 * but in practice, you might. This evaluator adds notes about
 * windows that either got truncated or stepped on another drg's dragon toes
 */
class DoubleDrgEvaluator implements WindowEvaluator {
	private doubleDrgNote: (window: HistoryEntry<EvaluatedAction[]>) => number

	constructor(doubleDrgNote: (window: HistoryEntry<EvaluatedAction[]>) => number) {
		this.doubleDrgNote = doubleDrgNote
	}

	// this is purely informational
	public suggest() { return undefined }

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput | undefined {
		const notes = windows.map(w => this.doubleDrgNote(w))
		if (notes.every(note => note === BL_DOUBLE_DRG_ERROR.NONE)) {
			return undefined
		}

		return {
			format: 'notes',
			header: {
				header: <Trans id="drg.battlelitany.rotation-table.header.buffed">Window Interference</Trans>,
				accessor: 'interference',
			},
			rows: notes.map(n => {
				if (n === BL_DOUBLE_DRG_ERROR.THEY_OVERWROTE) {
					return <Trans id="drg.battlelitany.notes.they-overwrote">Truncated by Other DRG</Trans>
				}

				if (n === BL_DOUBLE_DRG_ERROR.YOU_OVERWROTE) {
					return <Trans id="drg.battlelitany.notes.you-overwrote">You Overwrote an Existing Window</Trans>
				}

				return <></>
			}),
		}
	}
}

// Analyser port note:
// - currently investigating: using new BuffWindow module to handle this logic
// in this module we only want to track battle litany windows opened by
// the character selected for analysis. windows that clip into or overwrite other
// DRG litanies will be marked.
// Used DNC technical step as basis for this module.
export class BattleLitany extends BuffWindow {
	static override handle = 'battlelitany'
	static override title = t('drg.battlelitany.title')`Battle Litany`
	static override displayOrder = DISPLAY_ORDER.BATTLE_LITANY

	@dependency private actors!: Actors
	@dependency private globalCooldown!: GlobalCooldown

	buffAction = this.data.actions.BATTLE_LITANY
	buffStatus = this.data.statuses.BATTLE_LITANY

	// this is a raid buff that mirrors during its duration on all
	// party members and their pets. This window is centered around the
	// DRG who cast it though, so we don't care about those for
	// buff window tracking purposes.
	// (we do care about number of players hit though that's a different part)
	override trackSelfOnly = true

	// track the buff applications to players by all drgs
	private buffApplications: Array<{
		timestamp: number
		appliedByThisDrg: boolean
		job: string
	}> = []

	override initialise() {
		super.initialise()

		const blStatusFilter = filter<Event>().type('statusApply').status(this.data.statuses.BATTLE_LITANY.id)
		this.addEventHook(blStatusFilter, this.onBlStatusApply)

		const suggestionIcon = this.data.actions.BATTLE_LITANY.icon
		const suggestionWindowName = <ActionLink action="DRAGON_SIGHT" showIcon={false} />
		this.addEvaluator(new ExpectedGcdCountEvaluator({
			expectedGcds: BL_GCD_TARGET,
			globalCooldown: this.globalCooldown,
			suggestionIcon,
			suggestionContent: <Trans id="drg.bl.suggestions.missedgcd.content">
				Try to land at least 6 GCDs during every <ActionLink action="BATTLE_LITANY" /> window.
			</Trans>,
			suggestionWindowName,
			severityTiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
		}))

		this.addEvaluator(new PlayersBuffedEvaluator(this.affectedPlayers.bind(this)))
		this.addEvaluator(new DoubleDrgEvaluator(this.doubleDrgNote.bind(this)))
	}

	/**
	 * Logs status applications for later analysis
	 * Tracks if the buff was applied to player by this dragoon, and also
	 * logs the job of the affected player
	 * Job data was requested some time ago but am not sure how we want display to work
	 * or if we still want it, so just holding it in data for now.
	 */
	private onBlStatusApply(event: Events['statusApply']) {
		const targetActor = this.actors.get(event.target)
		if (targetActor.playerControlled) {
			this.buffApplications.push({
				timestamp: event.timestamp,
				appliedByThisDrg: event.source === this.parser.actor.id,
				job: targetActor.job,
			})
		}
	}

	// returns the number of players affected by the battle lit status application
	// in the window when the buff was active
	// this should be 8 in content we care about
	private affectedPlayers(buffWindow: HistoryEntry<EvaluatedAction[]>): number {
		const actualWindowDuration = (buffWindow?.end ?? buffWindow.start) - buffWindow.start

		// count the number of applications that happened in the window
		const affected = this.buffApplications.filter(ba => {
			return (
				ba.appliedByThisDrg &&
				buffWindow.start <= ba.timestamp &&
				ba.timestamp <= buffWindow.start + actualWindowDuration
			)
		})

		return affected.length
	}

	// returns a status code indicating if a buff window was overwritten or truncated
	// by overlapping battle litany
	private doubleDrgNote(buffWindow: HistoryEntry<EvaluatedAction[]>): number {
		const actualWindowDuration = (buffWindow?.end ?? buffWindow.start) - buffWindow.start
		const lookbackStart = buffWindow.start - this.buffStatus.duration

		// we check whether or not you overwrote someone else first, as you
		// can directly control that
		const otherDrgLookbackAppl = this.buffApplications.filter(ba => {
			return (
				!ba.appliedByThisDrg &&
				lookbackStart <= ba.timestamp &&
				ba.timestamp <= buffWindow.start
			)
		})

		// don't be rude
		if (otherDrgLookbackAppl.length > 0) {
			return BL_DOUBLE_DRG_ERROR.YOU_OVERWROTE
		}

		// next, we check if someone else overwrote you
		const otherDrgApplications = this.buffApplications.filter(ba => {
			return (
				!ba.appliedByThisDrg &&
				buffWindow.start <= ba.timestamp &&
				ba.timestamp <= buffWindow.start + actualWindowDuration
			)
		})

		// whoops looks like the other drg overwrote you, bummer
		if (otherDrgApplications.length > 0) {
			return BL_DOUBLE_DRG_ERROR.THEY_OVERWROTE
		}

		// otherwise we're all good
		return BL_DOUBLE_DRG_ERROR.NONE
	}
}
