import {Trans} from '@lingui/react'
import {ActionLink, DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Requirement, Rule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import DISPLAY_ORDER from 'parser/jobs/vpr/modules/DISPLAY_ORDER'
import React from 'react'

const PERFECTIO = 100 // 100% perfect, RPR would be proud
export class Vices extends Analyser {
	static override handle = 'Vices'
	static override displayOrder = DISPLAY_ORDER.VICES
	@dependency private checklist!: Checklist
	@dependency private data!: Data

	//For Each Vicewinder, there should be 1 hunter coil and 1 swiftskin coil, for each coil, there should be 2 of each bites
	private viceWinders = 0
	private huntersCoils = 0
	private swiftskinsCoils = 0
	private twinbloodBites = 0
	private twinfangBites = 0

	//Vicewinder Grants Twinblood and Twinfang bites
	VicewinderChain = [
		this.data.actions.VICEWINDER.id,
		this.data.actions.HUNTERS_COIL.id,
		this.data.actions.SWIFTSKINS_COIL.id,
		this.data.actions.TWINBLOOD_BITE.id,
		this.data.actions.TWINFANG_BITE.id,
	]

	//Vicepit grants twinblood and twinfang thresh
	private vicepit = 0
	private huntersDen = 0
	private swiftskinsDen = 0
	private twinbloodThresh = 0
	private twinfangThresh = 0

	VicepitChain = [
		this.data.actions.VICEPIT.id,
		this.data.actions.HUNTERS_DEN.id,
		this.data.actions.SWIFTSKINS_DEN.id,
		this.data.actions.TWINBLOOD_THRESH.id,
		this.data.actions.TWINFANG_THRESH.id,
	]

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(this.VicewinderChain)),
			this.vicewinderChainUsed,
		)

		this.addEventHook(
			playerFilter
				.type(oneOf(['action']))
				.action(oneOf(this.VicepitChain)),
			this.vicepitChainUsed,
		)

		this.addEventHook('complete', this.onComplete)
	}

	private vicewinderChainUsed(event: Events['action']) {
		if (event.action === this.data.actions.VICEWINDER.id) {
			this.viceWinders++
		} else if (event.action === this.data.actions.HUNTERS_COIL.id) {
			this.huntersCoils++
		} else if (event.action === this.data.actions.SWIFTSKINS_COIL.id) {
			this.swiftskinsCoils++
		} else if (event.action === this.data.actions.TWINBLOOD_BITE.id) {
			this.twinbloodBites++
		} else if (event.action === this.data.actions.TWINFANG_BITE.id) {
			this.twinfangBites++
		}
	}

	private vicepitChainUsed(event: Events['action']) {
		if (event.action === this.data.actions.VICEPIT.id) {
			this.vicepit++
		} else if (event.action === this.data.actions.HUNTERS_DEN.id) {
			this.huntersDen++
		} else if (event.action === this.data.actions.SWIFTSKINS_DEN.id) {
			this.swiftskinsDen++
		} else if (event.action === this.data.actions.TWINBLOOD_THRESH.id) {
			this.twinbloodThresh++
		} else if (event.action === this.data.actions.TWINFANG_THRESH.id) {
			this.twinfangThresh++
		}
	}

	private onComplete() {

		const Counters = {
			viceWinders: {action: this.data.actions.VICEWINDER, ready: this.viceWinders, done: this.viceWinders},
			huntersCoils: {action: this.data.actions.HUNTERS_COIL, ready: this.viceWinders, done: this.huntersCoils},
			swiftskinsCoils: {action: this.data.actions.SWIFTSKINS_COIL, ready: this.viceWinders, done: this.swiftskinsCoils},
			twinbloodBites: {action: this.data.actions.TWINBLOOD_BITE, ready: (this.viceWinders * 2), done: this.twinbloodBites},
			twinfangBites: {action: this.data.actions.TWINFANG_BITE, ready: (this.viceWinders * 2), done: this.twinfangBites},

			vicepit: {action: this.data.actions.VICEPIT, ready: this.vicepit, done: this.vicepit},
			huntersDen: {action: this.data.actions.HUNTERS_DEN, ready: this.vicepit, done: this.huntersDen},
			swiftskinsDen: {action: this.data.actions.SWIFTSKINS_DEN, ready: this.vicepit, done: this.swiftskinsDen},
			twinbloodThresh: {action: this.data.actions.TWINBLOOD_THRESH, ready: (this.vicepit * 2), done: this.twinbloodThresh},
			twinfangThresh: {action: this.data.actions.TWINFANG_THRESH, ready: (this.vicepit * 2), done: this.twinfangThresh},
		}

		this.checklist.add(new Rule({
			name: <Trans id="VPR.vice.waste.name"> Use your <DataLink action="VICEWINDER"/> & <DataLink action="VICEPIT" /> follow-ups </Trans>,
			displayOrder: DISPLAY_ORDER.VICES,
			target: PERFECTIO,
			description: <Trans id="vpr.vice.waste.content">
				Using <DataLink action="VICEWINDER"/> lets you use <DataLink action="HUNTERS_COIL"/> and <DataLink action="SWIFTSKINS_COIL"/> which grant <DataLink action="TWINBLOOD_BITE"/> and <DataLink action="TWINFANG_BITE"/>.
				<br/>
				Using <DataLink action="VICEPIT"/> lets you use <DataLink action="HUNTERS_DEN"/> and <DataLink action="SWIFTSKINS_DEN"/> which grant <DataLink action="TWINBLOOD_THRESH"/> and <DataLink action="TWINFANG_THRESH"/>.
				<br/>
				These skills are important to a Viper's damage and must be used immediately after the skill that grants them.
			</Trans>,
			requirements: [
				...Object.values(Counters)
					.filter(counter => counter.ready > 0)
					.map(counter => this.ChecklistRequirementMaker(counter))
					.filter((requirement): requirement is Requirement => requirement !== undefined),
			],
		}))
	}

	private ChecklistRequirementMaker(counter: {action: Action, ready: number, done: number }) {
		const actual = counter.done
		const expected = counter.ready
		if (expected > 0) {
			let percent = actual / expected * 100
			if (process.env.NODE_ENV === 'production') {
				percent = Math.min(percent, 100)
			}

			return new Requirement({
				name: <ActionLink {...counter.action}/>,
				percent: percent,
				weight: expected,
				overrideDisplay: `${actual} / ${expected} (${percent.toFixed(2)}%)`,
			})
		}
	}
}
