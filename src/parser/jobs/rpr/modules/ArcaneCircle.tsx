import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RaidBuffWindow, EvaluatedAction, TrackedActionGroup, ExpectedActionGroupsEvaluator} from 'parser/core/modules/ActionWindow'
import {DisplayedActionEvaluator} from 'parser/core/modules/ActionWindow/evaluators/DisplayedActionEvaluator'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Message} from 'semantic-ui-react'
import {OPENER_BUFFER} from '../constants'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

// The minimum AC length to hard require a Communio
const COMMUNIO_BUFFER = 8000

const SEVERITIES = {
	1: SEVERITY.MINOR,
	3: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

const REAPINGS_PER_BURST = 7
const LEMURES_PER_BURST = 4
const SACRIFICIUM_PER_BURST = 2
const HARVEST_PER_BURST = 1
const COMMUNIO_PER_BURST = 2

const INVERTOR = -1 // Magic numbers strikes again!
const OPENER_FEE = -0.5 // Opener costs half a burst

export class ArcaneCircle extends RaidBuffWindow {
	static override handle = 'arcaneCircle'
	static override title = t('rpr.arcanecircle.title')`Arcane Circle`
	static override displayOrder = DISPLAY_ORDER.ARCANE_CIRCLE

	override buffStatus = this.data.statuses.ARCANE_CIRCLE

	override prependMessages = <Message info>
		<Trans id="rpr.arcanecircle.prepend-message"> <ActionLink action="PERFECTIO"/> should be used under <ActionLink action="ARCANE_CIRCLE"/> when possible, but certain factors, such as needing to continue combo to prevent combo break or using it as a disengage tool to keep uptime, are more important than putting it in buffs. </Trans>
	</Message>

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionGroupsEvaluator({
			expectedActionGroups: [
				{
					actions: [
						this.data.actions.CROSS_REAPING,
						this.data.actions.VOID_REAPING,
						this.data.actions.GRIM_REAPING,
					],
					expectedPerWindow: REAPINGS_PER_BURST,

				},
				{
					actions: [
						this.data.actions.LEMURES_SLICE,
						this.data.actions.LEMURES_SCYTHE,
					],
					expectedPerWindow: LEMURES_PER_BURST,

				},
				{
					actions: [
						this.data.actions.SACRIFICIUM,
					],
					expectedPerWindow: SACRIFICIUM_PER_BURST,

				},
				{
					actions: [
						this.data.actions.PLENTIFUL_HARVEST,
					],
					expectedPerWindow: HARVEST_PER_BURST,

				},
				{
					actions: [
						this.data.actions.COMMUNIO,
					],
					expectedPerWindow: COMMUNIO_PER_BURST,

				},
			],
			suggestionIcon: this.data.actions.ARCANE_CIRCLE.icon,
			suggestionContent: <Trans id="rpr.arcanecircle.suggestions.content">
				Each <ActionLink action="ARCANE_CIRCLE"/> window should contain 2 uses of <ActionLink action="COMMUNIO"/>
				and 1 use of <ActionLink action="PLENTIFUL_HARVEST"/>. In your opener, only 1 <ActionLink showIcon={false} action="COMMUNIO"/> is expected.
			</Trans>,
			suggestionWindowName: <ActionLink action="ARCANE_CIRCLE" showIcon={false} />,
			severityTiers: SEVERITIES,
			adjustCount: this.adjustCount.bind(this),
		}))

		this.addEvaluator(new DisplayedActionEvaluator([this.data.actions.PERFECTIO]))
	}

	private adjustCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedActionGroup) {
		const fightTimeRemaining = (this.parser.pull.timestamp + this.parser.pull.duration) - window.start

		if (this.isRushedEndOfPullWindow(window)) {
			if (fightTimeRemaining < COMMUNIO_BUFFER) {
				for (const skill of action.actions) {
					switch (skill) {

					case this.data.actions.CROSS_REAPING:
					case this.data.actions.VOID_REAPING:
					case this.data.actions.GRIM_REAPING:
						return (INVERTOR * REAPINGS_PER_BURST)

					case this.data.actions.LEMURES_SLICE:
					case this.data.actions.LEMURES_SCYTHE:
						return (INVERTOR * LEMURES_PER_BURST)

					case this.data.actions.SACRIFICIUM:
						return (INVERTOR * SACRIFICIUM_PER_BURST)

					case this.data.actions.PLENTIFUL_HARVEST:
						return (INVERTOR * HARVEST_PER_BURST)

					case this.data.actions.COMMUNIO:
						return (INVERTOR * COMMUNIO_PER_BURST)

					default:
						return 0
					}
				}

				// We have enough time for 1 Communio, but not both
				for (const skill of action.actions) {
					switch (skill) {

					case this.data.actions.CROSS_REAPING:
					case this.data.actions.VOID_REAPING:
					case this.data.actions.GRIM_REAPING:
						return (OPENER_FEE * REAPINGS_PER_BURST)

					case this.data.actions.LEMURES_SLICE:
					case this.data.actions.LEMURES_SCYTHE:
						return (INVERTOR * LEMURES_PER_BURST)

					case this.data.actions.SACRIFICIUM:
						return (INVERTOR * SACRIFICIUM_PER_BURST)

					case this.data.actions.PLENTIFUL_HARVEST:
						return (INVERTOR * HARVEST_PER_BURST)

					case this.data.actions.COMMUNIO:
						return (OPENER_FEE * COMMUNIO_PER_BURST)

					default:
						return 0
					}
				}
			}

			// If it's not Communio, we don't care at this point
			for (const skill of action.actions) {
				if (skill !== this.data.actions.COMMUNIO) { return 0 }
			}

		}

		//If opener, everything but harvest is cut in half
		if (window.start - OPENER_BUFFER <= this.parser.pull.timestamp) {

			for (const skill of action.actions) {
				switch (skill) {

				case this.data.actions.CROSS_REAPING:
				case this.data.actions.VOID_REAPING:
				case this.data.actions.GRIM_REAPING:
					return Math.ceil((OPENER_FEE * REAPINGS_PER_BURST))

				case this.data.actions.LEMURES_SLICE:
				case this.data.actions.LEMURES_SCYTHE:
					return Math.ceil(OPENER_FEE * LEMURES_PER_BURST)

				case this.data.actions.SACRIFICIUM:
					return Math.ceil(OPENER_FEE * SACRIFICIUM_PER_BURST)

				case this.data.actions.COMMUNIO:
					return Math.ceil(OPENER_FEE * COMMUNIO_PER_BURST)

				default:
					return 0
				}
			}
		}

		return 0
	}
}
