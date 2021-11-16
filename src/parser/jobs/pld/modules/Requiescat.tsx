import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {dependency} from 'parser/core/Injectable'
import {BuffWindow, EvaluatedAction, ExpectedActionsEvaluator,  TrackedAction,  WindowEvaluator} from 'parser/core/modules/ActionWindow'
import {HistoryEntry} from 'parser/core/modules/ActionWindow/History'
import {GlobalCooldown} from 'parser/core/modules/GlobalCooldown'
import {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Message} from 'semantic-ui-react'
import {ensureArray} from 'utilities'

const SEVERITIES = {
	MISSED_CASTS: {
		1: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	},
	MISSED_BUFF_REQUIESCAT: {
		1: SEVERITY.MAJOR,
	},
}
const EXPECTED_HOLY_SPIRITS = 3

class RequiescatUsageEvaluator implements WindowEvaluator {
	// Because this class is not an Analyser, it cannot use Data directly to get the id or icon for Goring Blade, so require the action object in the constructor
	private requiescatIcon: string
	private requiescatUsages: {casts: number, buffs: number}

	constructor (requiescatUsages: {casts: number, buffs: number}, requiescatIcon: string) {
		this.requiescatUsages = requiescatUsages
		this.requiescatIcon = requiescatIcon
	}

	suggest() {
		const missedRequiescatBuffs = this.requiescatUsages.casts - this.requiescatUsages.buffs

		return new TieredSuggestion({
			icon: this.requiescatIcon,
			why: <Trans id="pld.requiescat.suggestions.nobuff.why">
				<Plural value={missedRequiescatBuffs} one="# usage" other="# usages"/> while under 80% MP.
			</Trans>,
			content: <Trans id="pld.requiescat.suggestions.nobuff.content">
				<DataLink action="REQUIESCAT"/> should only be used when over 80% MP.
				Otherwise, you will not get the <DataLink status="REQUIESCAT"/> buff,
				which provides 50% increased magic damage, instant cast times,
				and allows you to cast <DataLink action="CONFITEOR"/>.
			</Trans>,
			tiers: SEVERITIES.MISSED_BUFF_REQUIESCAT,
			value: missedRequiescatBuffs,
		})
	}

	output() {
		return undefined
	}
}

export class Requiescat extends BuffWindow {
	static override handle = 'requiescat'
	static override title = t('pld.requiescat.title')`Requiescat Usage`

	@dependency globalCooldown!: GlobalCooldown

	override buffStatus = this.data.statuses.REQUIESCAT

	private requiescatUsages = {
		casts: 0,
		buffs: 0,
	}

	override initialise() {
		super.initialise()

		this.addEvaluator(new ExpectedActionsEvaluator({
			expectedActions: [
				{action: [this.data.actions.HOLY_SPIRIT, this.data.actions.HOLY_CIRCLE], expectedPerWindow: 3},
				{action: this.data.actions.CONFITEOR, expectedPerWindow: 1},
			],
			suggestionIcon: this.data.actions.HOLY_SPIRIT.icon,
			suggestionContent: <Trans id="pld.requiescat.suggestions.wrong-gcd.content">
				GCDs used during <DataLink action="REQUIESCAT" /> should consist of 3-4 uses of <DataLink action="HOLY_SPIRIT" /> (or
				multi-hit <DataLink action="HOLY_CIRCLE" />) and 1 use of <DataLink action="CONFITEOR" /> for optimal damage.
			</Trans>,
			suggestionWindowName: <DataLink action="REQUIESCAT" showIcon={false} />,
			severityTiers: {
				1: SEVERITY.MEDIUM,
				2: SEVERITY.MAJOR,
			},
			adjustCount: this.adjustExpectedActionsCount.bind(this),
		}))

		this.addEventHook({type: 'action', source: this.parser.actor.id, action: this.data.actions.REQUIESCAT.id}, () => this.requiescatUsages.casts++)
		this.addEventHook({type: 'statusApply', target: this.parser.actor.id, status: this.data.statuses.REQUIESCAT.id}, () => this.requiescatUsages.buffs++)

		this.addEvaluator(new RequiescatUsageEvaluator(this.requiescatUsages, this.data.actions.REQUIESCAT.icon))
	}

	private adjustExpectedActionsCount(window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) {
		if (window.end == null) {
			return 0
		}

		const windowDuration = window.end - window.start
		const expectedGcds = Math.floor(windowDuration / this.globalCooldown.getEstimate()) + 1
		if (expectedGcds < EXPECTED_HOLY_SPIRITS + 1 && ensureArray(action.action)[0] === this.data.actions.HOLY_SPIRIT) {
			return (expectedGcds - 1) - EXPECTED_HOLY_SPIRITS
		}

		if (expectedGcds === 0 && ensureArray(action.action)[0] === this.data.actions.CONFITEOR) {
			return -1
		}

		return 0
	}

	override output() {
		return <Fragment>
			<Message>
				<Trans id="pld.requiescat.table.note">Each of your <DataLink status="REQUIESCAT" /> windows should contain 4 spells at minimum to maintain the alignment of your rotation.
				Most of the time, a window should consist of 4 casts of <DataLink action="HOLY_SPIRIT" /> or <DataLink action="HOLY_CIRCLE" /> and end with a cast of <DataLink action="CONFITEOR" />.
				However, under some circumstances, it is useful to drop one <DataLink action="HOLY_SPIRIT"/> per minute in order to better align your rotation with buffs or mechanics.
				If you don't have a specific plan to do this, you should aim for 4 casts of <DataLink action="HOLY_SPIRIT" /> per <DataLink status="REQUIESCAT" /> window.</Trans>
			</Message>
			<>{super.output()}</>
		</Fragment>
	}
}
