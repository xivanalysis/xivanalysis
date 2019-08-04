import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import PrecastAction from 'parser/core/modules/PrecastAction'
import {Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import SectStatistic from './SectStatistic'

const NO_SECT_ICON = 'https://xivapi.com/i/064000/064017.png'

const ASPECTED_ACTIONS = [
	ACTIONS.ASPECTED_BENEFIC.id,
	ACTIONS.ASPECTED_HELIOS.id,
	ACTIONS.CELESTIAL_INTERSECTION.id,
	ACTIONS.CELESTIAL_OPPOSITION.id,
]

const DIURNAL_SECT_STATUSES = [
	STATUSES.ASPECTED_BENEFIC.id,
	STATUSES.ASPECTED_HELIOS.id,
	STATUSES.DIURNAL_OPPOSITION.id,
	STATUSES.NOCTURNAL_INTERSECTION.id,
	STATUSES.NOCTURNAL_BALANCE.id,
]

const NOCTURNAL_SECT_STATUSES = [
	STATUSES.NOCTURNAL_FIELD.id,
	STATUSES.NOCTURNAL_OPPOSITION.id,
	STATUSES.DIURNAL_INTERSECTION.id,
	STATUSES.DIURNAL_BALANCE.id,
]

const ACTION_STATUS_MAP = {
	[ACTIONS.ASPECTED_BENEFIC.id]: [
		STATUSES.ASPECTED_BENEFIC.id,
		STATUSES.NOCTURNAL_FIELD.id,
	],
	[ACTIONS.ASPECTED_HELIOS.id]: [
		STATUSES.ASPECTED_HELIOS.id,
		STATUSES.NOCTURNAL_FIELD.id,
	],
	[ACTIONS.CELESTIAL_INTERSECTION.id]: [
		STATUSES.DIURNAL_INTERSECTION.id,
		STATUSES.NOCTURNAL_INTERSECTION.id,
	],
	[ACTIONS.CELESTIAL_OPPOSITION.id]: [
		STATUSES.DIURNAL_OPPOSITION.id,
		STATUSES.NOCTURNAL_OPPOSITION.id,
	],
}

const SECT_ACTIONS = [
	ACTIONS.DIURNAL_SECT.id,
	ACTIONS.NOCTURNAL_SECT.id,
]

const SECT_STATUSES = [
	STATUSES.DIURNAL_SECT.id,
	STATUSES.NOCTURNAL_SECT.id,
]

const DIURNAL_SECT_BUFF_ABILITY = {
	name: STATUSES.DIURNAL_SECT.name,
	guid: STATUSES.DIURNAL_SECT.id,
	type: 1,
	abilityIcon: _.replace(_.replace(STATUSES.DIURNAL_SECT.icon, 'https://xivapi.com/i/', ''), '/', '-'),
}

const NOCTURNAL_SECT_BUFF_ABILITY = {
	name: STATUSES.NOCTURNAL_SECT.name,
	guid: STATUSES.NOCTURNAL_SECT.id,
	type: 1,
	abilityIcon: _.replace(_.replace(STATUSES.NOCTURNAL_SECT.icon, 'https://xivapi.com/i/', ''), '/', '-'),
}

// Determine sect by checking the result of an aspected spell/ability
export default class Sect extends Module {
	static handle = 'sect'

	@dependency private statistics!: Statistics
	@dependency private precastAction!: PrecastAction
	@dependency private suggestions!: Suggestions

	private pullWithoutSect = false
	private activeSectId: string | number | undefined = undefined
	private gaveup = false

	protected init() {
		this.addHook('cast', {abilityId: [...SECT_ACTIONS], by: 'player'}, this.onCast)
		this.addHook('applybuff', {abilityId: [...SECT_STATUSES], by: 'player'}, this.onApplySect)
		this.addHook('complete', this.onComplete)
	}

	normalise(events: any) {
		const startTime = this.parser.fight.start_time
		let aspectedCast: CastEvent | null = null

		for (const event of events) {
			if (event.type === 'applybuff' && SECT_STATUSES.includes(event.ability.guid)) {
				// They started the fight without a sect and switched it on mid-fight :blobsweat: we gud here
				break
			}

			if (!aspectedCast && event.type === 'cast' && ASPECTED_ACTIONS.includes(event.ability.guid)) {
				// Detecting a cast of an aspected action, so now we examine what comes out of it
				aspectedCast = event

			} else if (aspectedCast
				&& (event.type === 'applybuff' || event.type === 'refreshbuff') && [...NOCTURNAL_SECT_STATUSES, ...DIURNAL_SECT_STATUSES].includes(event.ability.guid)) {
				// This is an applybuff event of a sect buff that came after an aspected action

				if (this.mapCastToBuff(aspectedCast.ability.guid).includes(event.ability.guid)
					&& [...DIURNAL_SECT_STATUSES, ...NOCTURNAL_SECT_STATUSES].includes(event.ability.guid)) {

					const SECT_ABILITY = DIURNAL_SECT_STATUSES.includes(event.ability.guid) ? DIURNAL_SECT_BUFF_ABILITY : NOCTURNAL_SECT_BUFF_ABILITY

					// Fab a sect buff event at the start of the fight
					events.splice(0, 0, {
						...event,
						timestamp: startTime - 1,
						type: 'applybuff',
						ability: SECT_ABILITY,
						targetID: event.sourceID,
						targetIsFriendly: true,
						})
					break
				}
			} else {
				continue
			}

		}

		return events
	}

	private onCast(event: CastEvent) {
		// If they casted a sect at anytime it means they pulled without one on
		this.pullWithoutSect = true
		const sect = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (sect) {
			this.activeSectId = sect.id
		}
	}

	// Looking for the sect buff that we fabricated, but if they switched it on mid-fight that'll get picked up too
	private onApplySect(event: BuffEvent) {
		if (!this.activeSectId) {
			const sect = getDataBy(ACTIONS, 'id', this.mapBuffToCast(event.ability.guid))
			if (sect) {
				this.activeSectId = sect.id
			}
		}
	}

	private onComplete() {

		/*
			SUGGESTION: Pulled without Sect
		*/
		if (!this.gaveup && (this.pullWithoutSect || !this.activeSectId)) {
			this.suggestions.add(new Suggestion({
				icon: !this.activeSectId || ACTIONS.DIURNAL_SECT.id === this.activeSectId ? ACTIONS.DIURNAL_SECT.icon : ACTIONS.NOCTURNAL_SECT.icon,
				content: <Trans id="ast.sect.suggestions.no-sect.content">
					Don't start without <ActionLink {...ACTIONS.DIURNAL_SECT} /> or <ActionLink {...ACTIONS.NOCTURNAL_SECT} />. There are several abilities that can't be used without one of these stances.
				</Trans>,
				why: <Trans id="ast.sect.suggestions.no-sect.why">
					There was no sect detected at the start of the fight.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		/*
			SUGGESTION: Noct with Scholar
		*/
		const withScholar = this.parser.fightFriendlies.some(friendly => friendly.type === 'Scholar')
		if (this.activeSectId === ACTIONS.NOCTURNAL_SECT.id && withScholar ) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.NOCTURNAL_SECT.icon,
				content: <Trans id="ast.sect.suggestions.noct-with-sch.content">
					It is counter-productive to use this Sect with this composition. The main shields <StatusLink {...STATUSES.NOCTURNAL_FIELD} /> from <ActionLink {...ACTIONS.NOCTURNAL_SECT}/> do not stack with Scholar's main shield <StatusLink {...STATUSES.GALVANIZE} />.
				</Trans>,
				why: <Trans id="ast.sect.suggestions.noct-with-sch.why">
					Nocturnal Sect was used with a Scholar in the party.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		// Statistic box
		const icon = !this.activeSectId ? NO_SECT_ICON
						: ACTIONS.DIURNAL_SECT.id === this.activeSectId ? ACTIONS.DIURNAL_SECT.icon
							: ACTIONS.NOCTURNAL_SECT.icon
		const noSectValue = <Trans id="ast.sect.info.no-sect-detected">No sect detected</Trans>
		const value = !this.activeSectId ? noSectValue :
						ACTIONS.DIURNAL_SECT.id === this.activeSectId ? ACTIONS.DIURNAL_SECT.name
							: ACTIONS.NOCTURNAL_SECT.name
		this.statistics.add(new SectStatistic({
			icon,
			value,
			info: (<Trans id="ast.sect.info">
				The choice of Sect boils down to the content being played, group composition and player preference.<br/>
				<ActionLink {...ACTIONS.DIURNAL_SECT}/> provides more potency per heal from regens, and is most effective in dungeons and 8-man content if damage taken does not exceed maximum HP.<br/>
				<ActionLink {...ACTIONS.NOCTURNAL_SECT}/> is essential if shields are necessary for survival that <ActionLink {...ACTIONS.NEUTRAL_SECT}/> cannot cover. Noct shields cannot be stacked with Scholar's and is not recommended when healing alongside one.
			</Trans>),
		}))

	}

	// Helpers
	public mapCastToBuff(actionId: number) {
		if (ASPECTED_ACTIONS.includes(actionId)) {
			return ACTION_STATUS_MAP[actionId]
		}
		return []
	}

	public mapBuffToCast(statusId: number) {
		switch (statusId) {
			case STATUSES.NOCTURNAL_SECT.id:
				return ACTIONS.NOCTURNAL_SECT.id
			case STATUSES.DIURNAL_SECT.id:
				return ACTIONS.DIURNAL_SECT.id
			default:
				return -1
		}
	}

}
