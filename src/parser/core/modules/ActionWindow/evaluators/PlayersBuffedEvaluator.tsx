import {Trans} from '@lingui/react'
import {DataLink, StatusLink} from 'components/ui/DbLink'
import {Status, StatusKey} from 'data/STATUSES'
import {EvaluatedAction} from 'parser/core/modules/ActionWindow/EvaluatedAction'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY, SeverityTiers, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {EvaluationOutput, WindowEvaluator} from './WindowEvaluator'

const DEFAULT_EXPECTED_PLAYER_COUNT = 8
const DEFAULT_PLAYERS_MISSED_SEVERITY = {
	1: SEVERITY.MINOR,
}

export interface PlayersBuffedEvaluatorOptions {
	/**
	 * This is used to determine how many players were buffed in a given window.
	 * @param window The window to determine how many players were buffed
	 * @returns The amount of players buffed in the window
	 */
	affectedPlayers: (window: HistoryEntry<EvaluatedAction[]>) => number
	/**
	 * Defaults to full party size.
	 */
	expectedPlayerCount?: number
	/**
	 * Defaults to minor.
	 */
	severityTiers?: SeverityTiers,
	/**
	 * The status of the buff players are receiving.
	 */
	status: Status['id'],
	suggestionContent: JSX.Element,
	suggestionIcon: string
}

export class PlayersBuffedEvaluator implements WindowEvaluator {
	private readonly affectedPlayers: (window: HistoryEntry<EvaluatedAction[]>) => number
	private readonly expectedPlayerCount: number;
	private readonly severityTiers: SeverityTiers;
	private readonly status: Status['id'];
	private readonly suggestionContent: JSX.Element;
	private readonly suggestionIcon: string;

	constructor(opts: PlayersBuffedEvaluatorOptions) {
		this.affectedPlayers = opts.affectedPlayers
		this.expectedPlayerCount = opts.expectedPlayerCount || DEFAULT_EXPECTED_PLAYER_COUNT
		this.status = opts.status
		this.suggestionIcon = opts.suggestionIcon
		this.severityTiers = opts.severityTiers || DEFAULT_PLAYERS_MISSED_SEVERITY
		this.suggestionContent = opts.suggestionContent
	}

	public suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const missed = this.countAffectedPlayerPerWindow(windows).filter(value => value < this.expectedPlayerCount).length
		return new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			why: <Trans id="core.buffwindow.suggestions.playersbuffed.why">
				{missed} of your <StatusLink id={this.status}/> uses did not buff the full party.
			</Trans>,
			tiers: this.severityTiers,
			value: missed,
		})
	}

	public output(windows: Array<HistoryEntry<EvaluatedAction[]>>): EvaluationOutput {
		const affected = this.countAffectedPlayerPerWindow(windows)
		return {
			format: 'table',
			header: {
				header: <Trans id="core.buffwindow.table.header.playersbuffed">Players Buffed</Trans>,
				accessor: 'playersbuffed',
			},
			rows: affected.map(a => {
				return {
					actual: a,
					expected: this.expectedPlayerCount,
				}
			}),
		}
	}

	private countAffectedPlayerPerWindow(windows: Array<HistoryEntry<EvaluatedAction[]>>): number[] {
		return windows.map(w => this.affectedPlayers(w))
	}
}
