import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {Actors} from 'parser/core/modules/Actors'
import Downtime from 'parser/core/modules/Downtime'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'

const SEVERITIES = {
	MISSED_CASTS: {
		1: SEVERITY.MEDIUM,
		3: SEVERITY.MAJOR,
	},
	MISSED_CONFITEOR_GCDS: {
		1: SEVERITY.MAJOR,
	},
}
const REQUIESCAT_DURATION = 30000

const DIVINE_MIGHT_ACTIONS: ActionKey[] = [
	'HOLY_SPIRIT',
	'HOLY_CIRCLE',
]

const REQUIESCAT_ACTIONS: ActionKey[] = [
	'HOLY_SPIRIT',
	'HOLY_CIRCLE',
	'CONFITEOR',
	'BLADE_OF_FAITH',
	'BLADE_OF_TRUTH',
	'BLADE_OF_VALOR',
]

export class Requiescat extends BuffWindow {
	static override handle = 'requiescat'
	static override title = t('pld.requiescat.title')`Requiescat Usage`

	@dependency actors!: Actors
	@dependency downtime!: Downtime
	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.REQUIESCAT

	private requiescatUsages = 0

	override initialise() {
		super.initialise()

		const actionFilter = filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
		const isDivineMightAction = this.data.matchActionId(DIVINE_MIGHT_ACTIONS)
		const isRequiescatAction = this.data.matchActionId(REQUIESCAT_ACTIONS)
		this.setEventFilter((event): event is Events['action'] => {
			if (!actionFilter(event)) { return false }

			// If the player has divine might active, the holy spells can be ignored, they do not consume requi stacks.
			if (
				this.actors.current.hasStatus(this.data.statuses.DIVINE_MIGHT.id)
				&& isDivineMightAction(event.action)
			) {
				return false
			}

			// Otherwise, report any action effected by requi.
			return isRequiescatAction(event.action)
		})

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: this.data.actions.CONFITEOR, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_FAITH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_TRUTH, expectedPerWindow: 1},
				{action: this.data.actions.BLADE_OF_VALOR, expectedPerWindow: 1},
			],
			suggestionIcon: this.data.actions.REQUIESCAT.icon,
			suggestionContent: <Trans id="pld.requiescat.suggestions.missed-confiteor.content">
				Be sure to use <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, and <DataLink action="BLADE_OF_VALOR" /> in each <DataLink status="REQUIESCAT" /> window for optimal damage.
			</Trans>,
			suggestionWindowName: <DataLink action="REQUIESCAT" showIcon={false} />,
			severityTiers: SEVERITIES.MISSED_CONFITEOR_GCDS,
			adjustCount: this.adjustExpectedConfiteorGCDCount.bind(this),
		}))

		this.addEventHook({type: 'action', source: this.parser.actor.id, action: this.data.actions.REQUIESCAT.id}, () => this.requiescatUsages++)
	}

	private adjustExpectedConfiteorGCDCount(window: HistoryEntry<EvaluatedAction[]>) {
		if (window.end == null) {
			return 0
		}

		const originalWindowEnd = window.start + REQUIESCAT_DURATION
		const downtimeInWindow = this.downtime.getDowntime(window.start, originalWindowEnd)
		const adjustedWindowEnd = originalWindowEnd - downtimeInWindow
		const adjustedWindowDuration = adjustedWindowEnd - window.start
		if (adjustedWindowDuration < this.globalCooldown.getDuration()) {
			return -1
		}

		return 0
	}

	override output() {
		return <Fragment>
			<Message>
				<Trans id="pld.requiescat.table.note">Each of your <DataLink status="REQUIESCAT" /> windows should contain 4 spells
				, consisting of <DataLink action="CONFITEOR" />, <DataLink action="BLADE_OF_FAITH" />, <DataLink action="BLADE_OF_TRUTH" />
				, and <DataLink action="BLADE_OF_VALOR" /> for each each stack <DataLink status="REQUIESCAT" />.</Trans>
			</Message>
			<>{super.output()}</>
		</Fragment>
	}
}
