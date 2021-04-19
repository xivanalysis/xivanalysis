import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink} from 'components/ui/DbLink'
import TimeLineChart from 'components/ui/TimeLineChart'
import ACTIONS from 'data/ACTIONS'
import JOBS from 'data/JOBS'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'

// Generators
const GAUGE_GENERATORS = [ACTIONS.ATTACK.id]

const GAUGE_SPENDERS = [
	ACTIONS.COVER.id,
	ACTIONS.INTERVENTION.id,
	ACTIONS.SHELTRON.id,
]

// Gauge numbers
const GAUGE_MAX = 100
const GAUGE_START = 0
const GAUGE_GAIN_AMOUNT = 5
const GAUGE_SPEND_AMOUNT = 50

// Graph color
const GRAPH_COLOR = Color(JOBS.PALADIN.colour)
const BG_COLOR_FADE = 0.7
const BORDER_COLOR_FADE = 0.5

class GaugeState {
	t?: number
	y?: number
}

export default class OathGauge extends Module {
	static handle = 'oathGauge'
	static title = t('pld.gauge.title')`Oath Gauge Usage`

	@dependency private suggestions!: Suggestions

	// Defaults
	private gauge = GAUGE_START
	private waste = 0
	private history: GaugeState[] = []
	private ability = ''

	protected init() {
		this.addEventHook('cast', {
			by: 'player',
			abilityId: GAUGE_GENERATORS,
		}, this.onGaugeGenerate)

		this.addEventHook('cast', {
			by: 'player',
			abilityId: GAUGE_SPENDERS,
		}, this.onGaugeSpend)

		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onGaugeSpend() {
		this.gauge -= GAUGE_SPEND_AMOUNT
		this.updateHistory()
	}

	private onGaugeGenerate() {
		this.gauge += GAUGE_GAIN_AMOUNT
		if (this.gauge > GAUGE_MAX) {
			this.gauge = GAUGE_MAX
			this.waste += GAUGE_GAIN_AMOUNT
		}
		this.updateHistory()
	}

	private onDeath() {
		this.gauge = 0
		this.updateHistory()
	}

	private onComplete() {
		this.suggestions.add(new Suggestion({
			icon: ACTIONS.SHELTRON.icon,
			severity: SEVERITY.MINOR,
			content: <Trans id="pld.gauge.waste.suggestion.content">
					You should periodically use your gauge either on you with <ActionLink {... ACTIONS.SHELTRON}/> or in case you're off-tanking with an <ActionLink {...ACTIONS.INTERVENTION} /> on your tank partner.
			</Trans>,
			why: <Trans id="pld.gauge.waste.suggestion.why">
				A total of {this.waste} gauge was lost due to exceeding the cap, part of this should be used to reduce incoming damage either on you or on your tank partner
			</Trans>,
		}))
	}

	private updateHistory() {
		const timestamp = this.parser.currentTimestamp - this.parser.fight.start_time
		this.history.push({
			t: timestamp,
			y: this.gauge,
		})
	}

	output() {
		const data = {
			datasets: [
				{
					label: 'Oath Gauge',
					steppedLine: true,
					data: this.history,
					backgroundColor: GRAPH_COLOR.fade(BG_COLOR_FADE).toString(),
					borderColor: GRAPH_COLOR.fade(BORDER_COLOR_FADE).toString(),
				},
			],
		}
		const rampCheck = 5
		const options = {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						min: 0,
						max: GAUGE_MAX,
						callback: ((value: number) => {
							if (value % rampCheck === 0) {
								return value
							}
						}),
					},
				}],
			},
			/* eslint-disable @typescript-eslint/no-explicit-any */
			tootips: {
				callbacks: {
					label: function(tooltipItem: any, data: any) {
						const datasetIndex = tooltipItem.datasetIndex
						const valueIndex = tooltipItem.index
						const hovered = data.datasets[datasetIndex].data[valueIndex]

						return `${hovered.y} After ${hovered.source}`
					},
				},
			},
		}

		return <Fragment>
			<TimeLineChart data={data} options={options} />
			<Trans id="pld.gauge.waste">
				A total of {this.waste} Oath Gauge was wasted due to overcapping.
			</Trans>
		</Fragment>
	}
}
