import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {JOBS} from 'data/JOBS'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {CounterGauge, Gauge as CoreGauge} from 'parser/core/modules/Gauge'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'

const MAX_KAZEMATOI_STACKS = 5
const ARMOR_CRUSH_MODIFIER = 2
const AEOLIAN_EDGE_MODIFIER = -1

const OVERCAP_SEVERITY = {
	// TODO - Confirm what these should be
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}
const LEFTOVER_SEVERITY = {
	// TODO - Confirm what these should be
	3: SEVERITY.MEDIUM,
}
const UNBUFFED_SEVERITY = {
	// TODO - Confirm what these should be
	1: SEVERITY.MINOR,
	4: SEVERITY.MEDIUM,
}

// TODO - Implement some bullshit potency tracking logic so we can correct the gauge for multi-boss instances like dungeons and 24-man raids
export class Kazematoi extends CoreGauge {
	static override title = t('nin.kazematoi.title')`Kazematoi Gauge`

	@dependency private suggestions!: Suggestions

	private kazematoiGauge = this.add(new CounterGauge({
		graph: {
			label: <Trans id="nin.kazematoi.resource.label">Kazematoi</Trans>,
			color: JOBS.NINJA.colour,
		},
		maximum: MAX_KAZEMATOI_STACKS,
	}))

	private unbuffedAeolians: number = 0

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('combo').action(this.data.actions.ARMOR_CRUSH.id), () => this.kazematoiGauge.modify(ARMOR_CRUSH_MODIFIER))
		this.addEventHook(playerFilter.type('action').action(this.data.actions.AEOLIAN_EDGE.id), this.onAeolianEdge)
		this.addEventHook('complete', this.onComplete)
	}

	private onAeolianEdge() {
		if (this.kazematoiGauge.value === 0) {
			this.unbuffedAeolians++
			return
		}

		this.kazematoiGauge.modify(AEOLIAN_EDGE_MODIFIER)
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ARMOR_CRUSH.icon,
			content: <Trans id="nin.kazematoi.suggestions.waste.content">
				Avoid using <ActionLink action="ARMOR_CRUSH"/> when you have 4 or more Kazematoi stacks in order to maximize the number of times you can use a buffed <ActionLink action="AEOLIAN_EDGE"/>.
			</Trans>,
			tiers: OVERCAP_SEVERITY,
			value: this.kazematoiGauge.overCap,
			why: <Trans id="nin.kazematoi.suggestions.waste.why">
				Overcapping caused you to lose <Plural value={this.kazematoiGauge.overCap} one="# Kazematoi stack" other="# Kazematoi stacks"/> over the fight.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ARMOR_CRUSH.icon,
			content: <Trans id="nin.kazematoi.suggestions.leftover.content">
				Avoid ending fights with more than 2 Kazematoi stacks remaining, as it means that you used at least one <ActionLink action="ARMOR_CRUSH"/> that could have been a buffed <ActionLink action="AEOLIAN_EDGE"/> instead.
			</Trans>,
			tiers: LEFTOVER_SEVERITY,
			value: this.kazematoiGauge.value,
			why: <Trans id="nin.kazematoi.suggestions.leftover.why">
				You ended the fight with <Plural value={this.kazematoiGauge.value} one="# Kazematoi stack" other="# Kazematoi stacks"/> left.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.AEOLIAN_EDGE.icon,
			content: <Trans id="nin.kazematoi.suggestions.unbuffed.content">
				Avoid using <ActionLink action="AEOLIAN_EDGE"/> when you have 0 stacks of Kazematoi, as it does less damage than <ActionLink action="ARMOR_CRUSH"/> when unbuffed.
			</Trans>,
			tiers: UNBUFFED_SEVERITY,
			value: this.unbuffedAeolians,
			why: <Trans id="nin.kazematoi.suggestions.unbuffed.why">
				You used Aeolian Edge without a Kazematoi stack <Plural value={this.unbuffedAeolians} one="# time" other="# times"/>.
			</Trans>,
		}))
	}
}
