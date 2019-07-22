import {Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {getDataBy} from 'data'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent, Event} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Combatants from 'parser/core/modules/Combatants'
import {Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import SectStatistic from './SectStatistic'

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

// Just in case they go through a whole fight with no sect, we're not going to babysit the whole log
// tslint:disable-next-line: no-magic-numbers
const GIVE_UP_THRESHOLD = 60000

// Determine sect by checking the result of an aspected spell/ability
export default class Sect extends Module {
	static handle = 'sect'
	static dependencies = [
		// Forcing action to run first, cus we want to always splice in before it.
		'precastAction', // eslint-disable-line @xivanalysis/no-unused-dependencies
	]

	@dependency private statistics!: Statistics
	@dependency private suggestions!: Suggestions
	@dependency private combatants!: Combatants

	_castEvent: CastEvent | null = null
	_statusEvent: BuffEvent | null = null

	_pullWithoutSect = false
	_sectId: string | number | undefined = undefined

	_partyComp: string[] = []

	protected init() {
		this.addHook('cast', {abilityId: [...SECT_ACTIONS], by: 'player'}, this._onCast)
		this.addHook('applybuff', {abilityId: [...SECT_STATUSES], by: 'player'}, this._onApplySect)
		this.addHook('complete', this._onComplete)
	}

	normalise(events: any) {
		const startTime = this.parser.fight.start_time

		for (const event of events) {
			const targetId = event.targetID

			if (event.type === 'applybuff' && this._isBuffEvent(event)
				&& SECT_STATUSES.includes(event.ability.guid)) {
				// They started the fight without a sect and switched it on mid-fight :blobsweat: we gud here
				break
			}

			if (!this._castEvent && event.type === 'cast'
			&& this._isCastEvent(event) && ASPECTED_ACTIONS.includes(event.ability.guid)) {
				// Detecting a cast of an aspected action, so now we examine what comes out of it
				this._castEvent = event

			} else if (this._castEvent
				&& event.type === 'applybuff' && this._isBuffEvent(event)
				&& (DIURNAL_SECT_STATUSES.includes(event.ability.guid)
					|| NOCTURNAL_SECT_STATUSES.includes(event.ability.guid))) {
				// This is an applybuff event of a sect buff that came after an aspected action

				if (this._mapCastToBuff(this._castEvent.ability.guid).includes(event.ability.guid)
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

			} else if (event.timestamp - this.parser.fight.start_time >= GIVE_UP_THRESHOLD) {
				// Just give up after GIVE_UP_THRESHOLD
				break
			} else {
				continue
			}

		}

		return events
	}

	private _onCast(event: CastEvent) {
		// If they casted a sect at anytime it means they pulled without one on
		this._pullWithoutSect = true
		const sect = getDataBy(ACTIONS, 'id', event.ability.guid)
		if (sect) {
			this._sectId = sect.id
		}
	}

	// Looking for the sect buff that we fabricated, but if they switched it on mid-fight that'll get picked up too
	private _onApplySect(event: BuffEvent) {
		if (!this._sectId) {
			const sect = getDataBy(ACTIONS, 'id', this._mapBuffToCast(event.ability.guid))
			if (sect) {
				this._sectId = sect.id
			}
		}
	}

	private _onComplete() {

		/*
			SUGGESTION: Pulled without Sect
		*/
		if (this._pullWithoutSect || !this._sectId) {
			this.suggestions.add(new Suggestion({
				icon: !this._sectId || ACTIONS.DIURNAL_SECT.id === this._sectId ? ACTIONS.DIURNAL_SECT.icon : ACTIONS.NOCTURNAL_SECT.icon,
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
		const combatants = this.combatants.getEntities()
		for (const [key, combatant] of Object.entries(combatants)) {

			if (combatant.type === 'LimitBreak') {
				continue
			}
			this._partyComp.push(combatant.type)
		}

		// TODO: Localize this reference
		if (this._sectId === ACTIONS.NOCTURNAL_SECT.id && this._partyComp.includes('Scholar')) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.NOCTURNAL_SECT.icon,
				content: <Trans id="ast.sect.suggestions.noct-with-sch.content">
					It is counter-productive to use this Sect with this composition. The main shields <StatusLink {...STATUSES.NOCTURNAL_FIELD} /> from <ActionLink {...ACTIONS.NOCTURNAL_SECT}/> do not stack with Scholar's main shield <StatusLink {...STATUSES.GALVANIZE} />.
				</Trans>,
				why: <Trans id="ast.sect.suggestions.noct-with-sch.why">
					Nocturnal Sect was used with a scholar in the party.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		if (this._sectId) {
			const icon = ACTIONS.DIURNAL_SECT.id === this._sectId || !this._sectId ? ACTIONS.DIURNAL_SECT.icon : ACTIONS.NOCTURNAL_SECT.icon
			const value = ACTIONS.DIURNAL_SECT.id === this._sectId || !this._sectId ? ACTIONS.DIURNAL_SECT.name : ACTIONS.NOCTURNAL_SECT.name
			// Statistic box
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

	}

	// Helpers
	private _isCastEvent(event: Event): event is CastEvent {
		if ((event as CastEvent).type) {
			return true
		}
		return false
	}

	private _isBuffEvent(event: Event): event is BuffEvent {
		if ((event as BuffEvent).type) {
			return true
		}
		return false
	}

	private _mapCastToBuff(actionId: number) {
		if (ASPECTED_ACTIONS.includes(actionId)) {
			return ACTION_STATUS_MAP[actionId]
		}
		return []
	}

	private _mapBuffToCast(statusId: number) {
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
