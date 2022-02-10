import {t, Trans} from '@lingui/macro'
import React from 'react'
import {DataLink} from '../../../../components/ui/DbLink'
import {Event} from '../../../../event'
import {Analyser} from '../../../core/Analyser'
import {filter} from '../../../core/filter'
import {dependency} from '../../../core/Injectable'
import {CooldownDowntime} from '../../../core/modules/CooldownDowntime'
import {Data} from '../../../core/modules/Data'
import {DataSet, PieChartStatistic, SimpleStatistic, Statistics} from '../../../core/modules/Statistics'

export class PBStats extends Analyser {
	static override handle = 'pbstats'
	static override title = t('mnk.pbstats.title')`Perfect Balance`

	@dependency private cooldownDowntime!: CooldownDowntime
	@dependency private data!: Data
	@dependency private statistics!: Statistics

	private aegisCasts = 0

	override initialise() {
		this.addEventHook(
			filter<Event>()
				.source(this.parser.actor.id)
				.action(this.data.actions.PERFECT_BALANCE.id)
				.type('action'),
			() => this.aegisCasts += 1)
		this.addEventHook('complete', this.onComplete)
	}

	private onComplete() {
		const maxUses = this.cooldownDowntime.calculateMaxUsages({cooldowns: [this.data.actions.PERFECT_BALANCE]})

		const data: DataSet<React.ReactNode, 2> = [{
			value: 5,
			color: '#9b6c6c',
			columns: [
				<DataLink action="PHANTOM_RUSH"/>,
				'5',
			],
		},
		{
			value: 5,
			color: '#d59b54',
			columns: [
				<DataLink action="RISING_PHOENIX"/>,
				'5',
			],
		},
		{
			value: 3,
			color: '#7b90c5',
			columns: [
				<DataLink action="ELIXIR_FIELD"/>,
				'3',
			],
		},
		{
			value: 1,
			color: '#8d85a6',
			columns: [
				<DataLink action="CELESTIAL_REVOLUTION"/>,
				'1',
			],
		}]

		this.statistics.add(new PieChartStatistic({
			headings: [
				'Blitz',
				'Amount',
			],
			data: data,
		}))

		this.statistics.add(new SimpleStatistic({
			icon: this.data.actions.PERFECT_BALANCE.icon,
			title: <Trans id="mnk.pbstats.statistic-title">Radiant Aegis Uses</Trans>,
			value: <>{this.aegisCasts} / {maxUses} ({Math.floor(100 * this.aegisCasts / maxUses)}%)</>,
			info: <Trans id="mnk.pbstats.info">The shield from Radiant Aegis can provide a significant amount of
				self-shielding over
				the course of the fight. This shielding could potentially save you from deaths due to failed mechanics
				or under-mitigation and healing.</Trans>,
		}))
	}
}
