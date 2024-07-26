import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Action} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import Checklist, {Requirement, TARGET, TieredRule} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {fillActions} from 'utilities/fillArrays'
import {FORM_ACTIONS, FORMLESS_APPLYING_ACTIONS, OPO_OPO_ACTIONS} from './constants'

const SEVERITIES = {
	FORMLESS: {
		100: TARGET.SUCCESS,
		95: TARGET.WARN,
	},
	POST_OPO_ACTIONS: {
		100: TARGET.SUCCESS,
		90: TARGET.WARN,
	},
	OVERWRITTEN_FORMLESS: {
		1: SEVERITY.MINOR,
		3: SEVERITY.MEDIUM,
	},
}

interface Usages {
	correct: number
	total: number
}

/**
 * Bookending is an important concept for Monks. Since Opo-opo GCDs have the
 * highest average potency of the three forms, we want to manipulate our rotation
 * to maximize the number of Opo-opo GCDs we use. This is achieved by weaving PB
 * after an opo (skipping the next two forms) and then using the resulting Formless
 * on another opo. You "bookend" the PB window by using opos on either side of it.
 */
export class Bookending extends Analyser {
	static override handle = 'bookending'

	@dependency private actors!: Actors
	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	private opoActions: Array<Action['id']> = []
	private lastFormAction: Action['id'] = 0
	private formlessUsages: Usages = {correct: 0, total: 0}
	private pbUsages: Usages = {correct: 0, total: 0}
	private frUsages: Usages = {correct: 0, total: 0}
	private formlessOverwrites = 0

	override initialise() {
		this.opoActions = fillActions(OPO_OPO_ACTIONS, this.data)
		const formActions = fillActions(FORM_ACTIONS, this.data)
		const formlessActions = fillActions(FORMLESS_APPLYING_ACTIONS, this.data)

		const baseFilter = filter<Event>()
			.source(this.parser.actor.id)

		const formFilter = baseFilter
			.type('action')
			.action(oneOf(formActions))

		const formlessFilter = baseFilter
			.type('action')
			.action(oneOf(formlessActions))

		const perfectBalanceFilter = baseFilter
			.type('action')
			.action(this.data.actions.PERFECT_BALANCE.id)

		const firesReplyFilter = baseFilter
			.type('action')
			.action(this.data.actions.FIRES_REPLY.id)

		this.addEventHook(formFilter, this.onFormAction)
		this.addEventHook(formlessFilter, this.onFormlessFistApplier)
		this.addEventHook(perfectBalanceFilter, this.onPerfectBalance)
		this.addEventHook(firesReplyFilter, this.onFiresReply)
		this.addEventHook('complete', this.onComplete)
	}

	private onFormAction(event: Events['action']) {
		this.lastFormAction = event.action

		if (!this.actors.current.hasStatus(this.data.statuses.FORMLESS_FIST.id)) {
			return
		}

		if (this.opoActions.includes(event.action)) {
			this.formlessUsages.correct++
		}

		this.formlessUsages.total++
	}

	private onFormlessFistApplier() {
		if (this.actors.current.hasStatus(this.data.statuses.FORMLESS_FIST.id)) {
			this.formlessOverwrites++
			this.formlessUsages.total++
		}
	}

	private onPerfectBalance() {
		if (this.opoActions.includes(this.lastFormAction)) {
			this.pbUsages.correct++
		}
		this.pbUsages.total++
	}

	private onFiresReply() {
		if (this.opoActions.includes(this.lastFormAction)) {
			this.frUsages.correct++
		}
		this.frUsages.total++
	}

	private onComplete() {
		let formlessPercent = this.formlessUsages.correct / this.formlessUsages.total * 100
		let pbPercent = this.pbUsages.correct / this.pbUsages.total * 100
		let frPercent = this.frUsages.correct / this.frUsages.total * 100

		if (process.env.NODE_ENV === 'production') {
			formlessPercent = Math.min(formlessPercent, 100)
			pbPercent = Math.min(pbPercent, 100)
			frPercent = Math.min(frPercent, 100)
		}

		this.checklist.add(new TieredRule({
			name: <Trans id="mnk.bookending.formless.checklist.name">Consume <DataLink status="FORMLESS_FIST" /> with Opo-opo actions</Trans>,
			description: <Trans id="mnk.bookending.formless.checklist.description">
				Opo-opo actions have the highest average potency of the three forms. Try to maximize uses of these actions by consuming <DataLink status="FORMLESS_FIST" /> on <DataLink action="LEAPING_OPO" />, <DataLink action="SHADOW_OF_THE_DESTROYER" />, or <DataLink action="DRAGON_KICK" />.
			</Trans>,
			tiers: SEVERITIES.FORMLESS,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.bookending.formless.checklist.requirement"><DataLink status="FORMLESS_FIST" /> used on Opo-opo actions</Trans>,
					percent: formlessPercent,
					overrideDisplay: `${this.formlessUsages.correct} / ${this.formlessUsages.total} (${formlessPercent.toFixed(2)}%)`,
				}),
			],
		}))

		this.checklist.add(new TieredRule({
			name: <Trans id="mnk.bookending.pb.checklist.name">Use <DataLink action="PERFECT_BALANCE" /> and <DataLink action="FIRES_REPLY" /> after Opo-opo actions</Trans>,
			description: <Trans id="mnk.bookending.pb.checklist.description">
				Opo-opo actions have the highest average potency of the three forms. Try to maximize uses of these actions by following them up with <DataLink action="PERFECT_BALANCE" /> or <DataLink action="FIRES_REPLY" />, which allows you to skip the next two forms in the sequence.
			</Trans>,
			tiers: SEVERITIES.POST_OPO_ACTIONS,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.bookending.pb.checklist.pb-requirement"><DataLink status="PERFECT_BALANCE" /> used after Opo-opo actions</Trans>,
					percent: pbPercent,
					overrideDisplay: `${this.pbUsages.correct} / ${this.pbUsages.total} (${pbPercent.toFixed(2)}%)`,
				}),
				new Requirement({
					name: <Trans id="mnk.bookending.pb.checklist.fr-requirement"><DataLink action="FIRES_REPLY" /> used after Opo-opo actions</Trans>,
					percent: frPercent,
					overrideDisplay: `${this.frUsages.correct} / ${this.frUsages.total} (${frPercent.toFixed(2)}%)`,
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.FORM_SHIFT.icon,
			content: <Trans id="mnk.bookending.formless.suggestion.content">
				Using <DataLink action="FORM_SHIFT" />, <DataLink action="FIRES_REPLY" />, or any Masterful Blitz with <DataLink status="FORMLESS_FIST" /> already active may cause you to lose uses of Opo-opo actions. Try to spend the buff on an Opo-opo action before generating a new one.
			</Trans>,
			tiers: SEVERITIES.OVERWRITTEN_FORMLESS,
			value: this.formlessOverwrites,
			why: <Trans id="mnk.bookending.formless.suggestion.why">
				You overwrote <DataLink status="FORMLESS_FIST" /> <Plural value={this.formlessOverwrites} one="# time" other="# times" />.
			</Trans>,
		}))
	}
}
