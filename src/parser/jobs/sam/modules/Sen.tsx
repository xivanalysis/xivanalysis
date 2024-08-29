import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import Color from 'color'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import TransMarkdown from 'components/ui/TransMarkdown'
import {Event, Events} from 'event'
import _ from 'lodash'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {SetGauge} from 'parser/core/modules/Gauge/SetGauge'
import {ResourceGraphs} from 'parser/core/modules/ResourceGraphs'
import {GAUGE_FADE} from 'parser/core/modules/ResourceGraphs/ResourceGraphs'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React, {Fragment} from 'react'
import {Message, Icon} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import {Kenki} from './Kenki'

// defining a const message to assign later via markdown

const samWarningMessage = t('sam.sen.rotation-table.disclaimer')` This module labels a "Standard Sen Window" to be a window that with no Sen overwrites that ends on an Iaijutsu. Please consult The Balance Discord and this [Infograph](https://i.imgur.com/C0ryA5F) for more details on looping Samurai gameplay.`

const KENKI_PER_SEN = 10

const SEN_HANDLING = {
	NONE: {priority: 0, message: <> No errors </>},
	HAGAKURE: {priority: 10, message: <Trans id = "sam.sen.sen_handling.hagakure"> Contains a Standard Filler Hagakure. </Trans>},
	NON_STANDARD_HAGAKURE: {priority: 15, message: <Trans id = "sam.sen.sen_handling.d_hagakure"> Contains a Non-Standard use of Hagakure. </Trans>},
	OVERWROTE_SEN: {priority: 20, message: <Trans id = "sam.sen.sen_handling.overwrote_sen"> Contains a Overwritten Sen. </Trans>},
	OVERWROTE_SENS: {priority: 25, message: <Trans id = "sam.sen.sen_handling.overwrote_sens"> Contains Overwritten Sens. </Trans>},
	DEATH: {priority: 30, message: <Trans id = "sam.sen.sen_handling.death"> Contains your death. </Trans>}, // BET YOU WISH YOU USED THIRD EYE NOW RED!
}

const SETSU_VALUE = 'setsu'
const GETSU_VALUE = 'getsu'
const KA_VALUE = 'ka'

const SETSU_COLOR = Color('#379ea0').fade(GAUGE_FADE)
const GETSU_COLOR = Color('#2b4c7d').fade(GAUGE_FADE)
const KA_COLOR = Color('#ab3330').fade(GAUGE_FADE)

// God this grew outta control real fast

class SenState {
	start: number
	end?: number
	rotation: Array<Events['action']>
	isNonStandard: boolean = false // Aka Hagakure + Overwrites, used to filter later.
	isDone: boolean = false // I SWEAR TO GOD IF THIS JANK THING WORKS, I'M LEAVING IT
	isDeath: boolean = false
	hasHagakure: boolean = false
	hasOverwrite: boolean = false

	// Sen State trackers, do I really need to explain?
	currentSetsu: number = 0
	currentGetsu: number = 0
	currentKa: number = 0

	overwriteSetsus: number = 0
	overwriteGetsus: number = 0
	overwriteKas: number = 0

	kenkiGained: number = 0 // Kenki # * 10

	_senCode: {priority: number, message: JSX.Element} = SEN_HANDLING.NONE

	public set senCode(code) {
		if (code.priority > this._senCode.priority) {
			this._senCode = code
		}
	}

	public get senCode() {
		return this._senCode
	}

	// This includes waste
	public get totalSenGenerated() {
		return (this.overwriteSetsus + this.overwriteGetsus + this.overwriteKas) + (this.currentSetsu + this.currentGetsu + this.currentKa)
	}

	public get wastedSens() {
		return (this.overwriteSetsus + this.overwriteGetsus + this.overwriteKas)
	}

	public get currentSens() {
		return (this.currentSetsu + this.currentGetsu + this.currentKa)
	}

	constructor(start: number) {
		this.start = start
		this.rotation = []
	}
}

export class Sen extends Analyser {
	static override displayOrder = DISPLAY_ORDER.SEN
	static override handle = 'sen'
	static override title = t('sam.sen.title')`Non-Standard Sen Windows`

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private kenki!: Kenki
	@dependency private timeline!: Timeline
	@dependency private resourceGraphs!: ResourceGraphs

	private wasted = 0
	private nonStandardCount = 0
	private hagakureCount = 0

	private senStateWindows: SenState[] = []

	private get lastSenState(): SenState | undefined {
		return _.last(this.senStateWindows)
	}

	SEN_ACTIONS = [
		this.data.actions.YUKIKAZE.id,
		this.data.actions.GEKKO.id,
		this.data.actions.MANGETSU.id,
		this.data.actions.KASHA.id,
		this.data.actions.OKA.id,
	]

	// Setsu = Yuki, Getsu = Gekko Man, Ka = Kasha Oka

	SEN_REMOVERS = [
		this.data.actions.HIGANBANA.id,
		this.data.actions.TENKA_GOKEN.id,
		this.data.actions.TENDO_GOKEN.id,
		this.data.actions.MIDARE_SETSUGEKKA.id,
		this.data.actions.TENDO_SETSUGEKKA.id,
		this.data.actions.HAGAKURE.id,
	]

	THINGS_WE_WANT_IN_THE_TABLE = [
		this.data.actions.HAKAZE.id,
		this.data.actions.JINPU.id,
		this.data.actions.SHIFU.id,
		this.data.actions.FUKO.id,

		this.data.actions.GEKKO.id,
		this.data.actions.KASHA.id,
		this.data.actions.YUKIKAZE.id,
		this.data.actions.MANGETSU.id,
		this.data.actions.OKA.id,

		this.data.actions.OGI_NAMIKIRI.id,
		this.data.actions.KAESHI_NAMIKIRI.id,

		// Sen Spenders
		this.data.actions.HIGANBANA.id,
		this.data.actions.TENKA_GOKEN.id,
		this.data.actions.TENDO_GOKEN.id,
		this.data.actions.TENDO_SETSUGEKKA.id,
		this.data.actions.MIDARE_SETSUGEKKA.id,
		this.data.actions.HAGAKURE.id,

		//Tsubames
		this.data.actions.KAESHI_GOKEN.id,
		this.data.actions.TENDO_KAESHI_GOKEN.id,
		this.data.actions.TENDO_KAESHI_SETSUGEKKA.id,
		this.data.actions.KAESHI_SETSUGEKKA.id,

		// I'm leaving these in as they are a way to handle Filler. not the usual way, but a way
		this.data.actions.ENPI.id,
		this.data.actions.HISSATSU_YATEN.id,
		this.data.actions.HISSATSU_GYOTEN.id,

		// OGCDS IGAF about.
		this.data.actions.MEIKYO_SHISUI.id,
	]

	private senGauge = new SetGauge({
		options: [
			{
				value: SETSU_VALUE,
				label: <Trans id="sam.sen.setsu.label">Setsu</Trans>,
				color: SETSU_COLOR,
			},
			{
				value: GETSU_VALUE,
				label: <Trans id="sam.sen.getsu.label">Getsu</Trans>,
				color: GETSU_COLOR,
			},
			{
				value: KA_VALUE,
				label: <Trans id="sam.sen.ka.label">Ka</Trans>,
				color: KA_COLOR,
			},
		],
		graph: {
			handle: 'sen',
			label: <Trans id="sam.sen.gauge.label">Sen</Trans>,
		},
	})

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(playerFilter.type('action').action(oneOf(this.THINGS_WE_WANT_IN_THE_TABLE)), this.checkCastAndPush)
		this.addEventHook(playerFilter.type('combo').action(oneOf(this.SEN_ACTIONS)), this.onSenGen)
		this.addEventHook(playerFilter.type('action').action(oneOf(this.SEN_REMOVERS)), this.remove)
		this.addEventHook(filter<Event>().type('death').actor(this.parser.actor.id), this.onDeath)

		// Suggestion time~
		this.addEventHook('complete', this.onComplete)

		// Since Sen isn't extending core Gauge (yet), handle setting up the senGauge gauge manually
		this.senGauge.setParser(this.parser)

		this.senGauge.setResourceGraphs(this.resourceGraphs)
		this.senGauge.init()
	}

	// Handles Sen Gen
	private onSenGen(event: Events['combo']): void {
		const action = this.data.getAction(event.action)

		const lastSenState = this.lastSenState

		if (lastSenState != null && lastSenState.end == null) { // The state already exists

			switch (action) {
			case this.data.actions.YUKIKAZE:
				lastSenState.currentSetsu++
				this.senGauge.generate(SETSU_VALUE)

				if (lastSenState.currentSetsu > 1) {
					lastSenState.overwriteSetsus++
					lastSenState.currentSetsu = 1
					lastSenState.hasOverwrite = true
				}
				break

			case this.data.actions.GEKKO:
			case this.data.actions.MANGETSU:
				lastSenState.currentGetsu++
				this.senGauge.generate(GETSU_VALUE)

				if (lastSenState.currentGetsu > 1) {
					lastSenState.overwriteGetsus++
					lastSenState.currentGetsu = 1
					lastSenState.hasOverwrite = true
				}

				break

			case this.data.actions.KASHA:
			case this.data.actions.OKA:
				lastSenState.currentKa++
				this.senGauge.generate(KA_VALUE)

				if (lastSenState.currentKa > 1) {
					lastSenState.overwriteKas++
					lastSenState.currentKa = 1
					lastSenState.hasOverwrite = true
				}

				break
			}
		}
	}

	// Function that handles SenState check, if no senState call the maker and then push to the rotation
	checkCastAndPush(event: Events['action']) : void {
		// check the sen state, if undefined/not active, make one

		let lastSenState = this.lastSenState

		if ((lastSenState == null) || (lastSenState.isDone === true)) {

			this.senStateMaker(event)
		}

		lastSenState = this.lastSenState

		if (lastSenState != null && lastSenState.end == null) { // The state already exists

			// Push action
			lastSenState.rotation.push(event)
		}

	}

	// Make a new sen state!
	private senStateMaker(event: Events['action']) : void {
		const senState = new SenState(event.timestamp)
		this.senStateWindows.push(senState)

	}

	private senCodeProcess() {
		const lastSenState = this.lastSenState

		if (lastSenState != null && lastSenState.end == null) {
			// Drop down the totem pole

			if (lastSenState.isDeath === true && (lastSenState.totalSenGenerated > 0)) {
				lastSenState._senCode = SEN_HANDLING.DEATH
				lastSenState.isNonStandard = true
				this.nonStandardCount++
			} else if (lastSenState.hasOverwrite === true && lastSenState.wastedSens > 1) {
				lastSenState._senCode = SEN_HANDLING.OVERWROTE_SENS
				lastSenState.isNonStandard = true
				this.nonStandardCount++
			} else if (lastSenState.hasOverwrite === true) {
				lastSenState._senCode = SEN_HANDLING.OVERWROTE_SEN
				lastSenState.isNonStandard = true
				this.nonStandardCount++
			} else if (lastSenState.hasHagakure === true && lastSenState.currentSens > 1) {
				lastSenState._senCode = SEN_HANDLING.NON_STANDARD_HAGAKURE
				lastSenState.isNonStandard = true
				this.nonStandardCount++
				this.hagakureCount++
			} else if (lastSenState.hasHagakure === true) {
				lastSenState._senCode = SEN_HANDLING.HAGAKURE
				lastSenState.isNonStandard = true
				this.nonStandardCount++
				this.hagakureCount++
			}
		}

	}

	// End the state, count wastes, add it
	private remove(event: Events['action']) : void {
		const lastSenState = this.lastSenState
		const action = this.data.getAction(event.action)

		if (lastSenState != null && lastSenState.end == null && action != null) {

			if (action.id === this.data.actions.HAGAKURE.id) {
				lastSenState.kenkiGained = lastSenState.currentSens * KENKI_PER_SEN
				lastSenState.hasHagakure = true

				this.kenki.onHagakure(lastSenState.kenkiGained)
			}

			this.wasted = this.wasted + lastSenState.wastedSens

			lastSenState.isDone = true
			this.senCodeProcess()
			lastSenState.end = event.timestamp
		}
		this.senGauge.reset()
	}

	private onDeath() {
		const lastSenState = this.lastSenState

		if (lastSenState != null && lastSenState.end == null) {
			this.wasted = this.wasted + lastSenState.totalSenGenerated

			lastSenState.isDone = true
			lastSenState.isDeath = true
			this.senCodeProcess()
			lastSenState.end = this.parser.currentEpochTimestamp
		}
		this.senGauge.reset()
	}

	private onComplete() {
		this.senGauge.generateResourceGraph()

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.MEIKYO_SHISUI.icon,
			content: <Trans id ="sam.sen.suggestion.content">
				You used <DataLink action = "GEKKO"/>, <DataLink action = "KASHA"/>, or <DataLink action = "YUKIKAZE"/> at a time when you already had that sen, thus wasting a combo because it did not give you sen or you died while holding sen thus wasting it as well.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				3: SEVERITY.MAJOR,
			},
			value: this.wasted,
			why: <Trans id = "sam.sen.suggestion.why">You wasted {this.wasted} sen.</Trans>,
		}))
		if (this.hagakureCount === 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.HAGAKURE.icon,
				content: <Trans id = "sam.sen.no_hagakure.message"> <ActionLink {...this.data.actions.HAGAKURE}/> is a powerful tool that should be used to help keep your rotation looping smoothly. Use it to handle your filler phase of your rotation. </Trans>,
				severity: SEVERITY.MINOR,
				why: <Trans id = "sam.sen.suggestion.no_hagakure.why"> You never cast hagakure this fight. </Trans>,
			}))
		}

	}

	override output() {
		if (this.nonStandardCount !== 0) {
			return <Fragment>
				<Message>
					<Trans id="sam.sen.rotation-table.message"> This table serves as a way to better see the events that lend up to a Sen window that has been deemed "Non-Standard" as explained below. Dying, overwriting a sen, or using hagakure will cause a window to be flagged as Non-Standard.
					</Trans>
				</Message>

				<Message warning icon>
					<Icon name ="warning sign"/>
					<Message.Content>
						<TransMarkdown source ={samWarningMessage}/>
					</Message.Content>
				</Message>
				<RotationTable
					targets={[
						{
							header: <ActionLink showName={false} {...this.data.actions.YUKIKAZE}/>,
							accessor: 'setsu',
						},
						{
							header: <ActionLink showName={false} {...this.data.actions.GEKKO}/>,
							accessor: 'getsu',
						},
						{
							header: <ActionLink showName={false} {...this.data.actions.KASHA}/>,
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
								start: window.start - this.parser.pull.timestamp,

								end: window.end != null ?
									window.end - this.parser.pull.timestamp
									: window.start - this.parser.pull.timestamp,

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
}
