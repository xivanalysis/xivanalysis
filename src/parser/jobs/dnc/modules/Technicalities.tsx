import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import _ from 'lodash'
import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {AoeEvent} from 'parser/core/modules/Combos'
import Suggestions, {TieredSuggestion} from 'parser/core/modules/Suggestions'

import {DEFAULT_SEVERITY_TIERS} from '../CommonData'

class TechnicalWindow {
	start: number
	end?: number

	hasDevilment: boolean = false
	gcdCount: number = 0
	timelyDevilment: boolean = true
	trailingGcdEvent?: AoeEvent

	constructor(start: number) {
		this.start = start
	}
}

export default class Technicalities extends Module {
	static handle = 'technicalities'
	static title = t('dnc.technicalities.title')`Technical Windows`

	@dependency private combatants!: Combatants
	@dependency private suggestions!: Suggestions

	private history: TechnicalWindow[] = []
	private firstDevilment: boolean = false
	private badDevilments: number = 0

	protected init() {
		this.addHook('applybuff', {to: 'player', abilityId: STATUSES.TECHNICAL_FINISH.id}, this.onGainTechnical)
		this.addHook('removebuff', {to: 'player', abilityId: STATUSES.TECHNICAL_FINISH.id}, this.onRemoveTechnical)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.DEVILMENT.id}, this.onDevilment)
		this.addHook('aoedamage', {by: 'player'}, this.onDamageEvent)
		this.addHook('complete', this.onComplete)
	}

	private onGainTechnical(event: BuffEvent) {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		// Handle multiple dancer's buffs overwriting each other
		if (lastWindow && !lastWindow.end) {
			return
		}

		const newWindow = new TechnicalWindow(event.timestamp)
		this.history.push(newWindow)
	}

	private onRemoveTechnical(event: BuffEvent) {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		if (!lastWindow) {
			return
		}

		lastWindow.end = event.timestamp
	}

	private onDamageEvent(event: AoeEvent) {
		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		// If we don't have a window, bail
		if (!lastWindow) {
			return
		}

		const action = getDataBy(ACTIONS, 'id', event.ability.guid) as TODO

		// Can't do anything else if we didn't get a valid action object
		if (!action) {
			return
		}

		// If this window isn't done yet, increment the GCD counter if needed
		if (!lastWindow.end && action.onGcd) {
			lastWindow.gcdCount++
		}

		// If we haven't recorded a trailing GCD event for this closed window, do so now
		if (lastWindow.end && !lastWindow.trailingGcdEvent && action.onGcd) {
			lastWindow.trailingGcdEvent = action
		}
	}

	// Don't ding if this is the first Devilment, depending on which job the Dancer is partnered with, it may
	// be appropriate to use Devilment early. In all other cases, Devilment should be used during Technical Finish
	private onDevilment() {
		if (!this.combatants.selected.hasStatus(STATUSES.TECHNICAL_FINISH.id) && this.firstDevilment) {
			this.badDevilments++
		}

		if (!this.firstDevilment) {
			this.firstDevilment = true
		}

		const lastWindow: TechnicalWindow | undefined = _.last(this.history)

		// If we don't have a window for some reason, bail
		if (!lastWindow) {
			return
		}

		lastWindow.hasDevilment = true

		// Note if the Devilment was used after the second GCD
		if (lastWindow.gcdCount > 1) {
			lastWindow.timelyDevilment = false
		}
	}

	private onComplete() {
		// Suggestion to use Devilment under Technical
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.bad-devilments.content">
				Using <ActionLink {...ACTIONS.DEVILMENT} /> outside your <StatusLink {...STATUSES.TECHNICAL_FINISH} /> windows leads to an avoidable loss in DPS. Aside from certain opener situations, you should be using <ActionLink {...ACTIONS.DEVILMENT} /> at the beginning of your <StatusLink {...STATUSES.TECHNICAL_FINISH} /> windows.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: this.badDevilments,
			why: <Trans id="dnc.technicalities.suggestions.bad-devilments.why">
				<Plural value={this.badDevilments} one="# Devilment" other="# Devilments"/> used outside <StatusLink {...STATUSES.TECHNICAL_FINISH} />.
			</Trans>,
		}))

		// Suggestion to use Devilment ASAP in Technical
		const lateDevilments = this.history.filter(window => window.hasDevilment && ! window.timelyDevilment).length
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.DEVILMENT.icon,
			content: <Trans id="dnc.technicalities.suggestions.late-devilments.content">
				Using <ActionLink {...ACTIONS.DEVILMENT} /> as early as possible during your <StatusLink {...STATUSES.TECHNICAL_FINISH} /> windows allows you to maximize the multiplicative bonuses that both statuses give you. Try to use it within the first two GCDs of your window.
			</Trans>,
			tiers: DEFAULT_SEVERITY_TIERS,
			value: lateDevilments,
			why: <Trans id="dnc.technicalities.suggestions.late-devilments.why">
				<Plural value={lateDevilments} one="# Devilment was" other="# Devilments were"/> used later than optimal.
			</Trans>,
		}))
	}
}
