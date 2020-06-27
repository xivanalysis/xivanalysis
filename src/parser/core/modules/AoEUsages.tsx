import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import Module, {dependency} from 'parser/core/Module'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {Table} from 'semantic-ui-react'

export interface AoEAction {
	/**
	 * The AoE action to check usages of.
	 */
	aoeAction: Action
	/**
	 * The single target abilities that should be used in place of the AoE
	 * ability when there are not enough targets present.
	 */
	stActions: Action[]
	/**
	 * The minimum number of targets the AoE ability should hit per cast.
	 */
	minTargets: number
}

// This is duplicated from BuffWindow until a
// better sharing mechanism is in place.
interface SeverityTiers {
	[key: number]: number
}

/**
 * This module checks for usages of AoE skills that have single target alternatives,
 * such as BLMs Xenoglossy or NINs Hellfrog Medium, to ensure they hit the minimum
 * number of targets.  It should not be used to check skills that can hit AoE but do
 * not have alternatives, such as DRGs Dragonfire Dive or SMNs Deathflare, as it is
 * correct to use those skills on single targets.
 *
 * For the AoE combos of melee DPS and Tanks, define a trackedAbility with the first
 * abilities of the AoE and single target combos.  This is to provide leeway to finishing
 * AoE combos when the number of targets may drop below the minimum during the combo.
 */
export abstract class AoEUsages extends Module {
	static handle = 'aoeusages'
	static title = t('core.aoeusages.title')`Incorrect AoE Action Usage`

	@dependency private suggestions!: Suggestions

	/**
	 * Implementing modules MUST define the icon to be used for the suggestion.
	 */
	abstract suggestionIcon: string
	/**
	 * Implementing modules MUST define the actions that are to be monitored.
	 */
	abstract trackedActions: AoEAction[]

	/**
	 * Implementing modules MAY override the severity tiers for incorrect AoE usages.
	 */
	protected severity: SeverityTiers = {
		1: SEVERITY.MINOR,
		4: SEVERITY.MEDIUM,
		7: SEVERITY.MAJOR,
	}

	protected suggestionContent: JSX.Element | string = <Trans id="core.aoeusages.suggestion.content">
		Avoid using AoE actions when they would do less damage than an alternative single-target ability that shares a resource cost or cooldown.
		If the AoE skill cannot hit enough targets, the single-target ability will do more total damage and should be used instead.
	</Trans>

	private badUsages = new Map<number, number>()

	protected init() {
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: this.trackedActions.map(a => a.aoeAction.id)}, this.onAbility)
		this.addEventHook('complete', this.onComplete)
	}

	/**
	 * Implementing modules that have special logic where the number of minimum
	 * targets for a skill is not constant may override this as needed.
	 * @param event The event for which the number of minimum targets is being adjusted.
	 * @param minTargets The default number of minimum targets for the action as defined in trackedActions.
	 */
	protected adjustMinTargets(event: NormalisedDamageEvent, minTargets: number) {
		return minTargets
	}

	private onAbility(event: NormalisedDamageEvent) {
		const tracked = this.trackedActions.find(a => a.aoeAction.id === event.ability.guid)

		if (tracked === undefined) { return }

		const minTargets = this.adjustMinTargets(event, tracked.minTargets)
		if (event.hasSuccessfulHit && event.hitCount < minTargets) {
			this.badUsages.set(event.ability.guid, (this.badUsages.get(event.ability.guid) || 0) + 1)
		}
	}

	private onComplete() {
		const totalBadUsages = Array.from(this.badUsages.values()).reduce((acc, cur) => acc + cur, 0)

		this.suggestions.add(new TieredSuggestion({
			icon: this.suggestionIcon,
			content: this.suggestionContent,
			tiers: this.severity,
			value: totalBadUsages,
			why: <Trans id="core.aoeusages.suggestion.why">
				AoE actions were used against too few targets <Plural value={totalBadUsages} one="# time" other="# times" />.
			</Trans>,
		}))
	}

	output() {
		// if no bad usages were found, do not output anything
		if (this.badUsages.size === 0) { return }

		// if any bad usages were found, tell them which ones, how many times,
		// and tell them what they should have used instead
		return <>
		<Table collapsing unstackable>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="core.aoeusages.aoe-ability">AoE Action Used</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="core.aoeusages.st-alternative">Single Target Alternative</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="core.aoeusages.min-targets">Minimum Targets</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="core.aoeusages.number-bad-usages">Incorrect Usages</Trans></Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{this.trackedActions
				.filter(a => this.badUsages.has(a.aoeAction.id))
				.map(a => {
					return <Table.Row key={a.aoeAction.id}>
						<Table.Cell><ActionLink {...a.aoeAction} /></Table.Cell>
						<Table.Cell>{a.stActions.map(s => <ActionLink {...s} />)}</Table.Cell>
						<Table.Cell>{a.minTargets}</Table.Cell>
						<Table.Cell>{this.badUsages.get(a.aoeAction.id)}</Table.Cell>
					</Table.Row>
				})}
			</Table.Body>
		</Table>
		</>
	}
}
