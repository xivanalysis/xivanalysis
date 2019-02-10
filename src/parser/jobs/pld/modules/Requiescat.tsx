import {i18nMark, Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'

const SEVERITIES = {
	MISSED_HOLY_SPIRITS: {
		1: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	},
	MISSED_BUFF_REQUIESCAT: {
		1: SEVERITY.MAJOR,
	},
}

const CONSTANTS = {
	HOLY_SPIRIT: {
		EXPECTED: 5,
	},
}

class RequiescatState {
	start: number
	end: number | null = null
	rotation: CastEvent[] = []
	hasAscociatedBuff: boolean = false

	constructor(start: number) {
		this.start = start
	}

	get holySpirits(): number {
		return this.rotation.filter(event => event.ability.guid === ACTIONS.HOLY_SPIRIT.id).length
	}
}

export default class Requiescat extends Module {
	static handle = 'requiescat'
	static title = 'Requiescat Usage'
	static i18n_id = i18nMark('pld.requiescat.title') // tslint:disable-line:variable-name

	@dependency private suggestions!: Suggestions
	@dependency private combatants!: Combatants
	@dependency private timeline!: Timeline

	// Requiescat Casts
	private requiescats: RequiescatState[] = []

	private get lastRequiescat(): RequiescatState | undefined {
		return _.last(this.requiescats)
	}

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)
		this.addHook(
			'applybuff',
			{by: 'player', abilityId: STATUSES.REQUIESCAT.id},
			this.onApplyRequiescat,
		)
		this.addHook(
			'removebuff',
			{by: 'player', abilityId: STATUSES.REQUIESCAT.id},
			this.onRemoveRequiescat,
		)
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const actionId = event.ability.guid

		if (actionId === ACTIONS.ATTACK.id) {
			return
		}

		if (actionId === ACTIONS.REQUIESCAT.id) {
			// Add new cast to the list
			this.requiescats.push(new RequiescatState(event.timestamp))
		}

		const lastRequiescat = this.lastRequiescat

		// If we're still in the considered window, log our actions to it
		if (lastRequiescat != null && lastRequiescat.end == null) {
			lastRequiescat.rotation.push(event)
		}
	}

	private onApplyRequiescat() {
		const lastRequiescat = this.lastRequiescat

		if (lastRequiescat != null) {
			lastRequiescat.hasAscociatedBuff = true
		}
	}

	private onRemoveRequiescat(event: BuffEvent) {
		const lastRequiescat = this.lastRequiescat

		if (lastRequiescat != null) {
			lastRequiescat.end = event.timestamp
		}
	}

	private onComplete() {
		const missedHolySpirits = this.requiescats
			.filter(requiescat => requiescat.hasAscociatedBuff)
			.reduce((sum, requiescat) => sum + Math.max(0, CONSTANTS.HOLY_SPIRIT.EXPECTED - requiescat.holySpirits), 0)
		const missedRequiescatBuffs = this.requiescats.filter(requiescat => !requiescat.hasAscociatedBuff).length

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.REQUIESCAT.icon,
			why: <Trans id="pld.requiescat.suggestions.wrong-gcd.why">
				<Plural value={missedHolySpirits} one="# missing cast" other="# missing casts"/> during the <StatusLink {...STATUSES.REQUIESCAT}/> buff window.
			</Trans>,
			content: <Trans id="pld.requiescat.suggestions.wrong-gcd.content">
				GCDs used during <ActionLink {...ACTIONS.REQUIESCAT}/> should be limited to <ActionLink {...ACTIONS.HOLY_SPIRIT}/> for optimal damage.
			</Trans>,
			tiers: SEVERITIES.MISSED_HOLY_SPIRITS,
			value: missedHolySpirits,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.REQUIESCAT.icon,
			why: <Trans id="pld.requiescat.suggestions.nobuff.why">
				<Plural value={missedRequiescatBuffs} one="# usage" other="# usages"/> while under 80% MP.
			</Trans>,
			content: <Trans id="pld.requiescat.suggestions.nobuff.content">
				<ActionLink {...ACTIONS.REQUIESCAT}/> should only be used when over 80% MP. Try to not miss on the 20% Magic Damage buff <StatusLink {...STATUSES.REQUIESCAT}/> provides.
			</Trans>,
			tiers: SEVERITIES.MISSED_BUFF_REQUIESCAT,
			value: missedRequiescatBuffs,
		}))
	}

	private countAbility(rotation: CastEvent[], abilityId: number) {
		return rotation.reduce((sum, event) => sum + (event.ability.guid === abilityId ? 1 : 0), 0)
	}

	output() {
		return <RotationTable
			targets={[
				{
					header: <ActionLink showName={false} {...ACTIONS.HOLY_SPIRIT}/>,
					accessor: 'holySpirit',
				},
			]}
			data={this.requiescats
				.filter(requiescat => requiescat.hasAscociatedBuff)
				.map(requiescat => ({
					start: requiescat.start - this.parser.fight.start_time,
					end: requiescat.end != null ?
						requiescat.end - this.parser.fight.start_time
						: requiescat.start - this.parser.fight.start_time,
					targetsData: {
						holySpirit: {
							actual: this.countAbility(requiescat.rotation, ACTIONS.HOLY_SPIRIT.id),
							expected: CONSTANTS.HOLY_SPIRIT.EXPECTED,
						},
					},
					rotation: requiescat.rotation,
				}))
			}
			onGoto={this.timeline.show}
		/>
	}
}
