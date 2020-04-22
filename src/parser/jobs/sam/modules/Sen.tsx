import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {BuffEvent, CastEvent} from 'fflogs'
import _ from 'lodash'
import Module, {dependency} from 'parser/core/Module'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import Timeline from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import {ComboEvent} from 'parser/core/modules/Combos'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'

import Kenki from './Kenki'

const SEN_ACTIONS = [
	ACTIONS.YUKIKAZE.id,
	ACTIONS.GEKKO.id,
	ACTIONS.MANGETSU.id,
	ACTIONS.KASHA.id,
	ACTIONS.OKA.id
]

// Setsu = Yuki, Getsu = Gekko Man, Ka = Kasha Oka

const SEN_REMOVERS = [
        ACTIONS.HIGANBANA.id,
        ACTIONS.TENKA_GOKEN.id,
        ACTIONS.MIDARE_SETSUGEKKA.id,
	ACTIONS.HAGAKURE.id,
]

const THINGS_WE_WANT_IN_THE_TABLE = [
	ACTIONS.HAKAZE.id,
	ACTIONS.JINPU.id,
	ACTIONS.SHIFU.id,
	ACTIONS.FUGA.id,
	
	// I'm leaving these in as they are a way to handle Filler. not the usual way, but a way
	ACTIONS.ENPI.id,
	ACTIONS.HISSATSU_YATEN.id,
	ACTIONS.HISSATSU_GYOTEN.id,
	
	//OGCDS IGAF about.
	ACTIONS.HISSATSU_KAITEN.id,
	ACTIONS.MEIKYO_SHISUI.id,
]


const KENKI_PER_SEN = 10

const SEN_HANDLING = {
        NONE: {priority: 0, message: 'No errors'},
	OVERWROTE_SEN: {priority: 20, message: <Trans id = "sam.sen.sen_handling.overwrote_sen"> Contains a Overwrote Sen. </Trans>},
        HAGAKURE: {priority: 10, message: <Trans id = "sam.sen.sen_handling.hagakure"> Contains a possible filler Hagakure. </Trans>},
        DEATH: {priority: 30, message: <Trans id = "sam.sen.sen_handling.death"> You died. Don't. </Trans>}, // BET YOU WISH YOU USED THIRD EYE NOW RED!
}

// God this grew outta control real fast

class SenState {
	start: number
	end?: number
	rotation: CastEvent[] = []
	isNonStandard: boolean = false // Aka Hagakure + Overwrites, used to filter later.
	isDone: boolean = false // I SWEAR TO GOD IF THIS JANK THING WORKS, I'M LEAVING IT
	isDeath: boolean = false // DIE! DIE! DIE! -Reaper
	isHaga: boolean = false // is it a haga or no?
	isOverwrite: boolean = false // is it a overwrite or no?

	// Sen State trackers, do I really need to explain?
	currentSetsu: number = 0
	currentGetsu: number = 0
	currentKa: number = 0

	overwriteSetsus: number = 0
	overwriteGetsus: number = 0
	overwriteKas: number = 0

	kenkiGained: number = 0 // Kenki # * 10

	_senCode: {priority: number, message: TODO} = SEN_HANDLING.NONE

	public set senCode(code) {
		if (code.priority > this._senCode.priority) {
			this._senCode = code
		}
	}

	public get senCode() {
		return this._senCode
	}

	constructor(start: number) {
		this.start = start
	}
}

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
		// Things that give
		this.addEventHook(
			'cast', 
			{
				by: 'player',
				abilityId: THINGS_WE_WANT_IN_THE_TABLE
			},
			this.checkCastAndPush,
		)
		
		this.addEventHook(
			['normaliseddamage', 'combo'],
			{
				by: 'player',
				abilityId: SEN_ACTIONS,
			},
			this.onSenGen,
			
		)

		
		// Things that take
		this.addEventHook(
			'cast',
			{
				by: 'player',
				abilityId: SEN_REMOVERS,
			},
			this.remove,
		)

		this.addEventHook('death', {to: 'player'}, this.onDeath,)

		// Suggestion time~
		this.addEventHook('complete', this.onComplete)
	}

//Handles Sen Gen
	private onSenGen(event: ComboEvent)
	{
		const action = event.ability.guid

                // check the sen state, if undefined/not active, make one, I don't know how having 2 hooks fire will handle this, so safety.

                let lastSenState = this.lastSenState

		if (lastSenState != null && lastSenState.end == null) { // The state already exists

                        switch (action) {
                                case ACTIONS.YUKIKAZE.id:
                                        lastSenState.currentSetsu++

                                        if (lastSenState.currentSetsu > 1) {
                                                lastSenState.overwriteSetsus++
                                                lastSenState.currentSetsu = 1
                                                lastSenState.isNonStandard = true
                                                lastSenState.isOverwrite = true
                                                }
                                        break

                                case ACTIONS.GEKKO.id:
                                case ACTIONS.MANGETSU.id:
                                        lastSenState.currentGetsu++

                                        if (lastSenState.currentGetsu > 1 ) {
                                                lastSenState.overwriteGetsus++
                                                lastSenState.currentGetsu = 1
                                                lastSenState.isNonStandard = true
                                                lastSenState.isOverwrite = true

                                                }
                                        break

                                case ACTIONS.KASHA.id:
                                case ACTIONS.OKA.id:
                                        lastSenState.currentKa++

                                        if (lastSenState.currentKa > 1) {
                                                lastSenState.overwriteKas++
                                                lastSenState.currentKa = 1
                                                lastSenState.isNonStandard = true
                                                lastSenState.isOverwrite = true

                                                }
                                        break
                                }

                }

		
	}


// Function that handles SenState check, if no senState call the maker and then push to the rotation
	private checkCastAndPush(event: CastEvent) {
		
		// step 1: set action
		const action = event.ability.guid

		//step 2: FILTER EVERYTHING

		if(THINGS_WE_WANT_IN_THE_TABLE.hasOwnProperty(action) || SEN_ACTIONS.hasOwnProperty(action) || SEN_REMOVERS.hasOwnProperty(action) ) {

			// step 3: check the sen state, if undefined/not active, make one

			let lastSenState = this.lastSenState

			if ((typeof lastSenState === 'undefined') || (lastSenState.isDone === true) ) {

				this.senStateMaker(event)
			}

			lastSenState = this.lastSenState

			if (lastSenState != null && lastSenState.end == null) { // The state already exists

				// Push action
				lastSenState.rotation.push(event)
			}


		}	

	}

// Make a new sen state!
	private senStateMaker(event: CastEvent) {
		const senState = new SenState(event.timestamp)
		this.senStateWindows.push(senState)

	}

	private senCodeProcess() {
		const lastSenState = this.lastSenState

		if (lastSenState != null && lastSenState.end == null) {
			// Drop down the totem pole

			if (lastSenState.isDeath === true) {
				lastSenState._senCode = SEN_HANDLING.DEATH
			}

			else if (lastSenState.isOverwrite === true) {
				lastSenState._senCode = SEN_HANDLING.OVERWROTE_SEN
			}

			else if (lastSenState.isHaga === true) {
				lastSenState._senCode = SEN_HANDLING.HAGAKURE
			}
		}

	}

// End the state, count wastes, add it
	private remove(event: CastEvent) {
		const lastSenState = this.lastSenState

		if (lastSenState != null && lastSenState.end == null) {


			if(event.ability.guid === ACTIONS.HAGAKURE.id) {
				 lastSenState.kenkiGained = (lastSenState.currentSetsu + lastSenState.currentGetsu + lastSenState.currentKa) * KENKI_PER_SEN

                        	lastSenState.isNonStandard = true
                        	lastSenState.isHaga = true

                        	this.kenki.modify(lastSenState.kenkiGained)
			}


			this.wasted = this.wasted + (lastSenState.overwriteSetsus + lastSenState.overwriteGetsus + lastSenState.overwriteKas)

			lastSenState.isDone = true
			this.senCodeProcess()
			lastSenState.end = event.timestamp
		}
	}

	private onDeath() {
		const lastSenState = this.lastSenState

  		if (lastSenState != null && lastSenState.end == null) {
                        this.wasted = this.wasted + (lastSenState.overwriteSetsus + lastSenState.overwriteGetsus + lastSenState.overwriteKas) + (lastSenState.currentSetsu + lastSenState.currentGetsu + lastSenState.currentKa)

			lastSenState.isDone = true
			lastSenState.isDeath = true
			this.senCodeProcess()
                        lastSenState.end = this.parser.currentTimestamp
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
		return <Fragment>
			<Message>
				<Trans id="san.sen.rotation-table.message"> This table serves a dual purpose, The table contains all hagakure windows for easier visuals of when/how your sen state was when you used Hagakure in the fight and to highlight any time periods where you overwrote a Sen.
				</Trans>
			</Message>
				<Message warning icon>
					<Icon name="warning sign"/>
					<Message.Content>
						<Trans id="sam.sen.rotation-table.disclaimer">This module labels a "Standard Sen Window" to be a window with no sen overwrites that ends on a Iaijutsu.
							Please consult the balance discord's guides and this [infograph](https://i.imgur.com/L0Y7d6C.png) for more details on looping Samurai gameplay.
						</Trans>
					</Message.Content>
				</Message>
		<RotationTable
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
			notes={[
				{
					header: <Trans id = "sam.sen.sen_handling.why"> Why Non-Standard </Trans>,
					accessor: 'reason',
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
								// expected: window.setsu,
							},
							getsu: {
								actual: (window.currentGetsu + window.overwriteGetsus),
								// expected: window.getsu,
							},
							ka: {
								actual: (window.currentKa + window.overwriteKas),
								// expected: window.ka,
							},

						},
						notesMap: {
							reason: <>{window.senCode.message}</>,
						},

						rotation: window.rotation,

						})
					})
				}

			onGoto={this.timeline.show}
		/>
	</Fragment>
	}
}
