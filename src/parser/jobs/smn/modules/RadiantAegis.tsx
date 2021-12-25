import {t, Trans} from '@lingui/macro'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CooldownDowntime} from 'parser/core/modules/CooldownDowntime'
import {Data} from 'parser/core/modules/Data'
import {SimpleStatistic, Statistics} from 'parser/core/modules/Statistics'
import React from 'react'

export class RadiantAegis extends Analyser {
	static override handle = 'radiantaegis'
	static override title = t('smn.radiantaegis.title')`Radiant Aegis`

	@dependency private cooldownDowntime!: CooldownDowntime
	@dependency private data!: Data
	@dependency private statistics!: Statistics

	private aegisCasts = 0

	override initialise() {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(this.data.actions.RADIANT_AEGIS.id)
				.type('action'),
			() => this.aegisCasts += 1)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		const maxUses = this.cooldownDowntime.calculateMaxUsages({cooldowns: [this.data.actions.RADIANT_AEGIS]})

		this.statistics.add(new SimpleStatistic({
			icon: this.data.actions.RADIANT_AEGIS.icon,
			title: <Trans id="smn.radiantaegis.statistic-title">Radiant Aegis Uses</Trans>,
			value: <>{this.aegisCasts} / {maxUses} ({Math.floor(100 * this.aegisCasts / maxUses)}%)</>,
			info: <Trans id="smn.radiantaegis.info">The shield from Radiant Aegis can provide a significant amount of self-shielding over
			the course of the fight.  This shielding could potentially save you from deaths due to failed mechanics or under-mitigation and healing.</Trans>,
		}))
	}
}
