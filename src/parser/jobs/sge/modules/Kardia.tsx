import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {StatusKey} from 'data/STATUSES'
import {Analyser} from 'parser/core/Analyser'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import CheckList, {Requirement, Rule} from 'parser/core/modules/Checklist'
import Downtime from 'parser/core/modules/Downtime'
import {Statuses} from 'parser/core/modules/Statuses'
import React from 'react'

export class Kardia extends Analyser {
	static override handle = 'kardia'
	static override title = t('sge.kardia.title')`Kardia`

	@dependency private actors!: Actors
	@dependency private checklist!: CheckList
	@dependency private downtime!: Downtime
	@dependency private statuses!: Statuses

	override initialise() {
		this.addEventHook('complete', this.onComplete)
	}

	private getStatusUptimePercent(statusKey: StatusKey): number {
		// Exclude downtime from both the status time and expected uptime
		const statusTime = Math.max(this.statuses.getUptime(statusKey, this.actors.friends) - this.downtime.getDowntime(), 0)
		const uptime = Math.max(this.parser.currentDuration - this.downtime.getDowntime(), 0)

		return (statusTime / uptime) * 100
	}

	private onComplete() {
		// Kardion is the status the Sage themselves has active while Kardia is on another player, so that's the one we'll technically be checking uptime on
		const kardiaUptimePct = this.getStatusUptimePercent('KARDION')
		this.checklist.add(new Rule({
			name: <Trans id="sge.kardia.checklist.kardia.name">Choose a <DataLink status="KARDIA" /> target</Trans>,
			description: <Trans id="sge.kardia.checklist.kardia.description">
				Placing <DataLink status="KARDIA" /> on a player will heal them over time when you deal damage with your GCDs, allowing you keep them healthier without spending other resources to do so. Try to keep it on someone, like a tank, at all times.
			</Trans>,
			target: 95,
			requirements: [
				new Requirement({
					name: <Trans id="sge.kardia.checklist.kardia.uptime"><DataLink status="KARDIA" /> uptime (excluding downtime)</Trans>,
					percent: kardiaUptimePct,
				}),
			],
		}))
	}
}
