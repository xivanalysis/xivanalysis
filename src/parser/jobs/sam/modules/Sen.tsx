import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent, BuffEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import Timeline from 'parser/core/modules/Timeline'

import Kenki from './Kenki'

class SenState {
	start: number
	end?: number
	rotation: CastEvent[] = []
	isNonStandard: boolean = false //Aka Hagakure + Overwrites, used to filter later.

	//Sen State trackers, do I really need to explain?
	currentSetsu: number = 0
	currentGetsu: number = 0
	currentKa: number = 0
	
	overwriteSetsus: number = 0
	overwriteGetsus: number = 0
	overwriteKas: number = 0

	kenkiGained: number = 0 //Kenki # * 10

	constructor(start: number) {
		this.start = start
	}
}

const SEN_ACTIONS = [ACTIONS.YUKIKAZE.id,ACTIONS.GEKKO.id,ACTIONS.MANGETSU.id,ACTIONS.KASHA.id,ACTIONS.OKA.id]

//Setsu = Yuki, Getsu = Gekko Man, Ka = Kasha Oka

const IAIJUTSU = [
	ACTIONS.HIGANBANA.id,
	ACTIONS.TENKA_GOKEN.id,
	ACTIONS.MIDARE_SETSUGEKKA.id,
]

const KENKI_PER_SEN = 10

export default class Sen extends Module {
	static handle = 'Non-Standard Sen Windows'

	@dependency private suggestions!: Suggestions
	@dependency private kenki!: Kenki
	@dependency private timeline!: Timeline

	private wasted = 0

	private senStateWindows: SenState[] = []

	private get lastSenState(): SenState | undefined {
		return _.last(this.senStateWindows)
	}

	protected init() {
		this.addHook('cast', {by: 'player'}, this.onCast)

		// Death, as well as all Iaijutsu, remove all available sen
		this.addHook('cast', {by: 'player', abilityId: IAIJUTSU}, this.remove)
		this.addHook(
			'cast',
			{by: 'player', abilityId: ACTIONS.HAGAKURE.id},
			this.onHagakure,
		)
		this.addHook(
			'applybuff', {
			to: 'player',
			abilityId: [STATUSES.RAISE.id]}, this.onRevive)

		//this.addHook('death', {to: 'player'}, this.onDeath)

		// Suggestion time~
		this.addHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		//step 1: set action
		const action = event.ability.guid

		if(action === ACTIONS.ATTACK.id) {return} //Who put these auto attacks here?

		//step 2: check the sen state, if undefined/not active, make one

		let lastSenState = this.lastSenState

		if ( (!lastSenState)) {

			this.remove(event) //Remove the dead person's stuff
			this.senStateMaker(event)
		}

		lastSenState = this.lastSenState

		if (lastSenState != null && lastSenState.end == null) { //The state already exists
			
			//Push action
			lastSenState.rotation.push(event)

			if(SEN_ACTIONS.hasOwnProperty(action))
			{
				switch(action) {
                        	case ACTIONS.YUKIKAZE.id:
                                	lastSenState.currentSetsu++

                                	if(lastSenState.currentSetsu > 1) {
                                        	lastSenState.overwriteSetsus++
                                        	lastSenState.currentSetsu = 1
                                        	lastSenState.isNonStandard = true
                                        	}
                                	break

                        	case ACTIONS.GEKKO.id:
                	        case ACTIONS.MANGETSU.id:
        	                        lastSenState.currentGetsu++

	                                if(lastSenState.currentGetsu > 1 ) {
	                                        lastSenState.overwriteGetsus++
	                                        lastSenState.currentGetsu = 1
	                                        lastSenState.isNonStandard = true

                                        	}
                                	break

                        	case ACTIONS.KASHA.id:
                        	case ACTIONS.OKA.id:
                                	lastSenState.currentKa++

                        	        if(lastSenState.currentKa > 1) {
                	                        lastSenState.overwriteKas++
        	                                lastSenState.currentKa = 1
	                                        lastSenState.isNonStandard = true

                                	        }
                        	        break
                        	}

			}
		}

	}

	private senStateMaker(event: CastEvent) {
		const senState = new SenState(event.timestamp)
		this.senStateWindows.push(senState)

	}

	private remove(event: CastEvent) {
		const lastSenState = this.lastSenState
		
		if(lastSenState != null && lastSenState.end == null) {
			
			lastSenState.rotation.push(event)

			this.wasted = this.wasted + (lastSenState.overwriteSetsus + lastSenState.overwriteGetsus + lastSenState.overwriteKas)

			lastSenState.end = event.timestamp
		}
	}

	private onRevive(event: BuffEvent) {
		const lastSenState = this.lastSenState

                if(lastSenState != null && lastSenState.end == null) {
                        this.wasted = this.wasted + (lastSenState.overwriteSetsus + lastSenState.overwriteGetsus + lastSenState.overwriteKas)

                        lastSenState.end = event.timestamp
                }

	}


	

	private onHagakure(event: CastEvent) {
		
		const lastSenState = this.lastSenState
		
		if(lastSenState != null && lastSenState.end == null) {

			lastSenState.kenkiGained = (lastSenState.currentSetsu + lastSenState.currentGetsu + lastSenState.currentKa) * KENKI_PER_SEN

			lastSenState.isNonStandard = true

			this.kenki.modify(lastSenState.kenkiGained)

			this.remove(event)
		}
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.MEIKYO_SHISUI.icon,
			content: <Trans id ="sam.sen.suggestion.content">
				You used <ActionLink {...ACTIONS.GEKKO} />, <ActionLink {...ACTIONS.KASHA} />, or <ActionLink {...ACTIONS.YUKIKAZE} /> at a time when you already had that sen, thus wasting a combo because it did not give you sen.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this.wasted,
			why: <Trans id = "sam.sen.suggestion.why">You wasted {this.wasted} sen.</Trans>,
		}))
	}

	output() {
		return <RotationTable
			targets={[
				{
					header: <ActionLink showName={false} {...ACTIONS.YUKIKAZE}/>,
					accessor: 'setsu',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.GEKKO}/>,
					accessor: 'getsu',
				},
				{
					header: <ActionLink showName={false} {...ACTIONS.KASHA}/>,
					accessor: 'ka',
				},
			]}
			data={this.senStateWindows
				.filter(window => window.isNonStandard)
				.map(window => {
					return ({
						start: window.start - this.parser.fight.start_time,
					
						end: window.end != null ?
							window.end - this.parser.fight.start_time
							: window.start - this.parser.fight.start_time,
					
						targetsData: {
							setsu: {
								actual: (window.currentSetsu + window.overwriteSetsus),
								//expected: window.setsu,
							},
							getsu: {
								actual: (window.currentGetsu + window.overwriteGetsus),
								//expected: window.getsu,
							},
							ka: {
								actual: (window.currentKa + window.overwriteKas),
								//expected: window.ka,
							},
									
						},
					
						rotation: window.rotation,
					
						})
					})
				}
		
			onGoto={this.timeline.show}
		/>
	}
}

