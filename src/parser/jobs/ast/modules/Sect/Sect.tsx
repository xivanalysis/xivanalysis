import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Statistics} from 'parser/core/modules/Statistics'
import Suggestions, {SEVERITY, Suggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import SectStatistic from './SectStatistic'

/* unused AST related sectsy stuff. left here in case someone needs them in the future; however bleak sects' futures will be.
const ASPECTED_ACTIONS = [
	ACTIONS.ASPECTED_BENEFIC.id,
	ACTIONS.ASPECTED_HELIOS.id,
	ACTIONS.CELESTIAL_INTERSECTION.id,
	ACTIONS.CELESTIAL_OPPOSITION.id,
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
} */

const NO_SECT_ICON = 'https://xivapi.com/i/064000/064017.png'

// Determine sect by checking the result of an aspected spell/ability
export default class Sect extends Analyser {
	static override handle = 'sect'

	@dependency private statistics!: Statistics
	@dependency private suggestions!: Suggestions
	@dependency private data!: Data

	private pullWithoutSect = false
	private activeSectId: number | undefined = undefined
	private gaveup = false
	private DIURNAL_SECT_STATUSES: number[] | undefined = undefined
	private NOCTURNAL_SECT_STATUSES: number[] | undefined = undefined
	private SECT_STATUSES: number[] | undefined = undefined

	override initialise() {

		//this section sets up the statuses using this.data.statuses
		this.SECT_STATUSES = [
			this.data.statuses.DIURNAL_SECT.id,
			this.data.statuses.NOCTURNAL_SECT.id,
		]

		this.DIURNAL_SECT_STATUSES = [
			this.data.statuses.ASPECTED_BENEFIC.id,
			this.data.statuses.ASPECTED_HELIOS.id,
			this.data.statuses.DIURNAL_OPPOSITION.id,
			this.data.statuses.NOCTURNAL_INTERSECTION.id,
			this.data.statuses.NOCTURNAL_BALANCE.id,
		]

		this.NOCTURNAL_SECT_STATUSES = [
			this.data.statuses.NOCTURNAL_FIELD.id,
			this.data.statuses.NOCTURNAL_OPPOSITION.id,
			this.data.statuses.DIURNAL_INTERSECTION.id,
			this.data.statuses.DIURNAL_BALANCE.id,
		]

		//this section uses hooks to go through the various functions
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('statusApply')
			.status(oneOf([...this.SECT_STATUSES, ...this.NOCTURNAL_SECT_STATUSES, ...this.DIURNAL_SECT_STATUSES]))
		, this.onApplyStatus)
		this.addEventHook('complete', this.onComplete)
	}

	//to look for the sect buff or any relating sects statuses we would expect
	private onApplyStatus(event: Events['statusApply']) {

		//if they switched it mid-fight, this section will pick it up
		if (typeof this.SECT_STATUSES !== 'undefined' && this.SECT_STATUSES.includes(event.status)) {
			if (!this.activeSectId) {
				//specifically used to check whether a sect status existed by previous status as noted below. if it didn't exist before this status, then we assume they didn't have it to begin with since sect cannot be changed in combat
				//note: this will pick up instances where the sect is changed moments before the prepull as the sect takes approx 3.5 seconds to be applied; the sect will at least take 1 oGCD plus risks not being prepared for the pull.
				this.pullWithoutSect = true
			}
			this.activeSectId = event.status === this.data.statuses.DIURNAL_SECT.id ? this.data.actions.DIURNAL_SECT.id
				: event.status === this.data.statuses.NOCTURNAL_SECT.id ? this.data.actions.NOCTURNAL_SECT.id
					: undefined //I don't trust myself lol
		}

		//otherwise, if the status has been applied relating to one of the mapped statuses, then we fabricate the sect if it hadn't already been fabricated
		//using only !this.activeSectId will take out anything after the first buff which will not work in the case when noct/diurnal is used as part of the pre-pull actions and sect change happens prior to 0. Ideally as AST, I would like to see the sect used throughout the fight
		if ((typeof this.NOCTURNAL_SECT_STATUSES !== 'undefined' && this.NOCTURNAL_SECT_STATUSES.includes(event.status))
		|| (typeof this.DIURNAL_SECT_STATUSES !== 'undefined' && this.DIURNAL_SECT_STATUSES.includes(event.status))) {
			if (typeof this.DIURNAL_SECT_STATUSES !== 'undefined' && this.DIURNAL_SECT_STATUSES.includes(event.status)
			&& (this.activeSectId !== this.data.actions.DIURNAL_SECT.id || !this.activeSectId)) {
				this.activeSectId = this.data.actions.DIURNAL_SECT.id
			}
			if (typeof this.NOCTURNAL_SECT_STATUSES !== 'undefined' && this.NOCTURNAL_SECT_STATUSES.includes(event.status)
			&& (this.activeSectId !== this.data.actions.NOCTURNAL_SECT.id || !this.activeSectId)) {
				this.activeSectId = this.data.actions.NOCTURNAL_SECT.id
			}
		}
	}

	private onComplete() {

		/*
			SUGGESTION: Pulled without Sect
		*/
		if (!this.gaveup && (this.pullWithoutSect || !this.activeSectId)) {
			this.suggestions.add(new Suggestion({
				icon: !this.activeSectId || this.data.actions.DIURNAL_SECT.id === this.activeSectId ? this.data.actions.DIURNAL_SECT.icon : this.data.actions.NOCTURNAL_SECT.icon,
				content: <Trans id="ast.sect.suggestions.no-sect.content">
					Don't start without <DataLink action="DIURNAL_SECT" /> or <DataLink action="NOCTURNAL_SECT" />. There are several abilities that can't be used without one of these stances.
				</Trans>,
				why: <Trans id="ast.sect.suggestions.no-sect.why">
					There was no sect detected at the start of the fight or the sect was applied right before the fight began. In the case where a sect was applied right before the fight began, an Astrologian risks shifting a GCD or being unprepared for the start of the fight.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		/*
			SUGGESTION: Noct with Scholar
		*/
		const withScholar = this.parser.fightFriendlies.some(friendly => friendly.type === 'Scholar')
		if (this.activeSectId === this.data.actions.NOCTURNAL_SECT.id && withScholar) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.NOCTURNAL_SECT.icon,
				content: <Trans id="ast.sect.suggestions.noct-with-sch.content">
					It is counter-productive to use this Sect with this composition. The main shields <DataLink status="NOCTURNAL_FIELD" /> from <DataLink action="NOCTURNAL_SECT"/> do not stack with Scholar's main shield <DataLink status="GALVANIZE" />.
				</Trans>,
				why: <Trans id="ast.sect.suggestions.noct-with-sch.why">
					Nocturnal Sect was used with a Scholar in the party.
				</Trans>,
				severity: SEVERITY.MAJOR,
			}))
		}

		// Statistic box
		const icon = !this.activeSectId ? NO_SECT_ICON
			: this.data.actions.DIURNAL_SECT.id === this.activeSectId ? this.data.actions.DIURNAL_SECT.icon
				: this.data.actions.NOCTURNAL_SECT.icon
		const noSectValue = <Trans id="ast.sect.info.no-sect-detected">No sect detected</Trans>
		const value = !this.activeSectId ? noSectValue
			: this.data.actions.DIURNAL_SECT.id === this.activeSectId ? this.data.actions.DIURNAL_SECT.name
				: this.data.actions.NOCTURNAL_SECT.name
		this.statistics.add(new SectStatistic({
			icon,
			value,
			info: (<Trans id="ast.sect.info">
				The choice of Sect boils down to the content being played, group composition and player preference.<br/>
				<DataLink action="DIURNAL_SECT" /> provides more potency per heal from regens, and is most effective in dungeons and 8-man content if damage taken does not exceed maximum HP.<br/>
				<DataLink action="NOCTURNAL_SECT" /> is essential if shields are necessary for survival that <DataLink action="NEUTRAL_SECT"/> cannot cover. Noct shields cannot be stacked with Scholar's and is not recommended when healing alongside one.
			</Trans>),
		}))

	}
}
