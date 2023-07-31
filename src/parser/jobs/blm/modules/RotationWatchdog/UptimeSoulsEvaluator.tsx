import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {EvaluatedAction, WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {DEFAULT_SEVERITY_TIERS} from '../RotationWatchdog'

export interface UptimeSoulsEvaluatorOpts {
	umbralSoulAction: Action
	invulnerability: Invulnerability,
}

export class UptimeSoulsEvaluator implements WindowEvaluator {
	private umbralSoulAction: Action
	private invulnerability: Invulnerability

	constructor(opts: UptimeSoulsEvaluatorOpts) {
		this.umbralSoulAction = opts.umbralSoulAction
		this.invulnerability = opts.invulnerability
	}

	suggest(windows: Array<HistoryEntry<EvaluatedAction[]>>) {
		const uptimeSouls = windows.reduce((total, window) => {
			return total + window.data.filter(event => event.action.id === this.umbralSoulAction.id &&
				!this.invulnerability.isActive({timestamp: event.timestamp, types: ['invulnerable']})).length
		}, 0)

		return new TieredSuggestion({
			icon: this.umbralSoulAction.icon,
			content: <Trans id="blm.rotation-watchdog.suggestions.uptime-souls.content">
				Avoid using <DataLink action="UMBRAL_SOUL"/> when there is a target available to hit with a damaging ability. <DataLink showIcon={false} action="UMBRAL_SOUL"/> does no damage and prevents you from using other GCD skills. It should be reserved for downtime.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: uptimeSouls,
			why: <Trans id="blm.rotation-watchdog.suggestions.uptime-souls.why">
				<DataLink showIcon={false} action="UMBRAL_SOUL"/> was performed during uptime <Plural value={uptimeSouls} one="# time" other="# times"/>.
			</Trans>,
		})
	}

	output(_windows: Array<HistoryEntry<EvaluatedAction[]>>) { return undefined }
}
