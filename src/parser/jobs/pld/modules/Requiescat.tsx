import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Invulnerability from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React from 'react'

const SEVERITIES = {
	MISSED_CASTS: {
		1: SEVERITY.MEDIUM,
		5: SEVERITY.MAJOR,
	},
	MISSED_BUFF_REQUIESCAT: {
		1: SEVERITY.MAJOR,
	},
}

const CONSTANTS = {
	HOLY_SPIRIT: {
		EXPECTED: 4,
	},
	CONFITEOR: {
		EXPECTED: 1,
	},
}

const HOLY_SPIRIT_AND_CIRCLE_IDS = [
	ACTIONS.HOLY_SPIRIT.id,
	ACTIONS.HOLY_CIRCLE.id,
]

const REQUIESCAT_DURATION_MILLIS = STATUSES.REQUIESCAT.duration * 1000

class RequiescatState {
	start: number
	end: number | null = null
	rotation: CastEvent[] = []
	hasAscociatedBuff: boolean = false
	isRushing: boolean = false

	constructor(start: number) {
		this.start = start
	}

	get holySpirits(): number {
		return this.rotation.filter(event => HOLY_SPIRIT_AND_CIRCLE_IDS.includes(event.ability.guid)).length
	}

	get confiteors(): number {
		return this.rotation.filter(event => event.ability.guid === ACTIONS.CONFITEOR.id).length
	}
}

export default class Requiescat extends Module {
	static handle = 'requiescat'
	static title = t('pld.requiescat.title')`Requiescat Usage`

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private invuln!: Invulnerability

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
			const reqState = new RequiescatState(event.timestamp)
			const reqEnd = event.timestamp + REQUIESCAT_DURATION_MILLIS

			const isBossInvulnBeforeEnd = this.invuln.isUntargetable('all', reqEnd)
				|| this.invuln.isInvulnerable('all', reqEnd)

			reqState.isRushing = (reqEnd >= this.parser.fight.end_time)
				|| isBossInvulnBeforeEnd
			this.requiescats.push(reqState)
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
		// The difference between Holy Spirit and Confiteor is massive (450 potency before multipliers). For this reason, it condenses suggestions
		// to just log any missed Confiteor as a missed Holy Spirit, since Confiteor functionally just doubles your last Holy Spirit.
		const missedCasts = this.requiescats
			.filter(requiescat => requiescat.hasAscociatedBuff && !requiescat.isRushing)
			.reduce((sum, requiescat) =>
				sum + Math.max(0, CONSTANTS.HOLY_SPIRIT.EXPECTED - requiescat.holySpirits) + Math.max(0, CONSTANTS.CONFITEOR.EXPECTED - requiescat.confiteors), 0)
		const missedRequiescatBuffs = this.requiescats.filter(requiescat => !requiescat.hasAscociatedBuff).length

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.HOLY_SPIRIT.icon,
			why: <Trans id="pld.requiescat.suggestions.wrong-gcd.why">
				<Plural value={missedCasts} one="# missing cast" other="# missing casts"/> during the <StatusLink {...STATUSES.REQUIESCAT}/> buff window.
			</Trans>,
			content: <Trans id="pld.requiescat.suggestions.wrong-gcd.content">
				GCDs used during <ActionLink {...ACTIONS.REQUIESCAT}/> should consist of 4 uses of <ActionLink {...ACTIONS.HOLY_SPIRIT}/> (or
				multi-hit <ActionLink {...ACTIONS.HOLY_CIRCLE}/>) and 1 use of <ActionLink {...ACTIONS.CONFITEOR}/> for optimal damage.
			</Trans>,
			tiers: SEVERITIES.MISSED_CASTS,
			value: missedCasts,
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
				{
					header: <ActionLink showName={false} {...ACTIONS.CONFITEOR}/>,
					accessor: 'confiteor',
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
							actual: requiescat.holySpirits,
							expected: CONSTANTS.HOLY_SPIRIT.EXPECTED,
						},
						confiteor: {
							actual: requiescat.confiteors,
							expected: CONSTANTS.CONFITEOR.EXPECTED,
						},
					},
					rotation: requiescat.rotation,
				}))
			}
			onGoto={this.timeline.show}
		/>
	}
}
