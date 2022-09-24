import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {EncounterKey} from 'data/ENCOUNTERS'
import {Cause, Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Data} from 'parser/core/modules/Data'
import {Death} from 'parser/core/modules/Death'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const HUTON_MAX_DURATION_MILLIS = 60000 // Not in STATUSES/NIN.js because lolgauges

// TODO - Revisit how this sim works in the first place because it's fucky
const HUTON_START_DURATION_MILLIS_HIGH = 55000
const HUTON_START_DURATION_MILLIS_LOW = 49000

const HUTON_EXTENSION_LONG = 30000
const HUTON_EXTENSION_SHORT = 10000

const HUTON_EXTENSION_MILLIS: Array<[ActionKey, number]> = [
	['ARMOR_CRUSH', HUTON_EXTENSION_LONG],
	['HAKKE_MUJINSATSU', HUTON_EXTENSION_SHORT],
]

const DOWNTIME_DIFFERENCE_TOLERANCE = 10000 // If the downtime estimates are off by more than this, we can probably toss the low estimate

// Some bosses *coughChadarnookcough* require fucky pulls that result in your Huton timer being lower than normal when the fight starts
const BOSS_ADJUSTMENTS: Partial<Record<EncounterKey, number>> = {
	// DEMON_CHADARNOOK: 15000,
}

interface HutonEstimate {
	current: number,
	clipped: number,
	downtime: number,
	badAcs: number,
}

export class Huton extends Analyser {
	static override handle = 'huton'

	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private death!: Death
	@dependency private suggestions!: Suggestions

	private hutonExtensionMillis = new Map(HUTON_EXTENSION_MILLIS.map(
		pair => [this.data.actions[pair[0]].id, pair[1]]
	))

	private highEstimate: HutonEstimate = {
		current: HUTON_START_DURATION_MILLIS_HIGH - (BOSS_ADJUSTMENTS[this.parser.pull.encounter.key ?? 'TRASH'] || 0),
		clipped: 0,
		downtime: 0,
		badAcs: 0,
	}
	private lowEstimate: HutonEstimate = {
		current: HUTON_START_DURATION_MILLIS_LOW - (BOSS_ADJUSTMENTS[this.parser.pull.encounter.key ?? 'TRASH'] || 0),
		clipped: 0,
		downtime: 0,
		badAcs: 0,
	}
	private lastEventTime: number = this.parser.pull.timestamp // This one is shared

	override initialise() {
		const playerFilter = filter<Event>().source(this.parser.actor.id)
		const pets = this.parser.pull.actors.filter(actor => actor.owner === this.parser.actor).map(actor => actor.id)
		this.addEventHook(playerFilter.type('action').action(oneOf([this.data.actions.HUTON.id, this.data.actions.HURAIJIN.id])), this.onHutonCast)
		this.addEventHook(playerFilter.type('combo').action(oneOf(HUTON_EXTENSION_MILLIS.map(pair => this.data.actions[pair[0]].id))), this.onHutonCombo)
		this.addEventHook(filter<Event>()
			.source(oneOf(pets))
			.type('damage')
			.cause(filter<Cause>().action(this.data.actions.PHANTOM_KAMAITACHI_BUNSHIN.id)), this.onKamaitachi)
		this.addEventHook({type: 'death', actor: this.parser.actor.id}, this.onDeath)
		this.addEventHook({type: 'raise', actor: this.parser.actor.id}, this.onRaise)
		this.addEventHook('complete', this.onComplete)
	}

	private handleHutonRecast(estimate: HutonEstimate, elapsedTime: number) {
		if (estimate.current === 0) {
			estimate.downtime += elapsedTime
		}

		estimate.current = HUTON_MAX_DURATION_MILLIS
	}

	private onHutonCast(event: Events['action']) {
		const elapsedTime = (event.timestamp - this.lastEventTime)
		this.handleHutonRecast(this.highEstimate, elapsedTime)
		this.handleHutonRecast(this.lowEstimate, elapsedTime)
		this.lastEventTime = event.timestamp
	}

	private handleHutonExtension(estimate: HutonEstimate, actionId: number, amount: number, elapsedTime: number) {
		let newDuration = estimate.current - elapsedTime
		if (newDuration <= 0) {
			estimate.current = 0
			estimate.downtime -= newDuration // Since it's negative, this is basically addition
			if (actionId === this.data.actions.ARMOR_CRUSH.id) {
				// Only flag actual Armor Crushes for the badAcs property
				estimate.badAcs++
			}
		} else {
			newDuration += amount
			estimate.clipped += Math.max(newDuration - HUTON_MAX_DURATION_MILLIS, 0)
			estimate.current = Math.min(newDuration, HUTON_MAX_DURATION_MILLIS)
		}
	}

	private onHutonCombo(event: Events['combo']) {
		const elapsedTime = (event.timestamp - this.lastEventTime)
		const action = this.data.getAction(event.action)
		if (action == null) { return }

		// The .get() should never be undefined but we must appease the ts lint gods
		const extension = this.hutonExtensionMillis.get(action.id) ?? 0
		this.handleHutonExtension(this.highEstimate, action.id, extension, elapsedTime)
		this.handleHutonExtension(this.lowEstimate, action.id, extension, elapsedTime)
		this.lastEventTime = event.timestamp
	}

	private onKamaitachi(event: Events['damage']) {
		const elapsedTime = (event.timestamp - this.lastEventTime)
		this.handleHutonExtension(this.highEstimate, this.data.actions.HURAIJIN.id, HUTON_EXTENSION_SHORT, elapsedTime)
		this.handleHutonExtension(this.lowEstimate, this.data.actions.HURAIJIN.id, HUTON_EXTENSION_SHORT, elapsedTime)
		this.lastEventTime = event.timestamp
	}

	private onDeath() {
		// RIP
		this.highEstimate.current = 0
		this.lowEstimate.current = 0
	}

	private onRaise(event: Events['raise']) {
		// So floor time doesn't count against Huton uptime
		this.lastEventTime = event.timestamp
	}

	private getHutonAverages() {
		if (this.lowEstimate.downtime - this.highEstimate.downtime > DOWNTIME_DIFFERENCE_TOLERANCE) {
			// If the estimates are too far apart, the low one was probably bad, so we can just return the high one as-is
			return {
				clipped: this.highEstimate.clipped,
				downtime: this.highEstimate.downtime,
				badAcs: this.highEstimate.badAcs,
			}
		}

		// Otherwise, average the results
		return {
			clipped: Math.round((this.highEstimate.clipped + this.lowEstimate.clipped) / 2),
			downtime: Math.round((this.highEstimate.downtime + this.lowEstimate.downtime) / 2),
			badAcs: Math.round((this.highEstimate.badAcs + this.lowEstimate.badAcs) / 2),
		}
	}

	private onComplete() {
		const {clipped, downtime, badAcs} = this.getHutonAverages()
		const duration = this.parser.currentDuration - this.death.deadTime
		const uptime = ((duration - downtime) / duration) * 100
		this.checklist.add(new Rule({
			name: <Trans id="nin.huton.checklist.name">Keep Huton up</Trans>,
			description: <Fragment>
				<Trans id="nin.huton.checklist.description"><ActionLink action="HUTON"/> provides you with a 15% attack speed increase and as such is a <em>huge</em> part of a NIN's personal DPS. Do your best not to let it drop, and recover it as quickly as possible if it does.</Trans>
				<Message warning icon>
					<Icon name="warning sign"/>
					<Message.Content>
						<Trans id="nin.huton.checklist.description.warning">As Huton is now a gauge instead of a buff, please bear in mind that this is an estimate, not an exact value. This also applies to any Huton-related suggestions below.</Trans>
					</Message.Content>
				</Message>
			</Fragment>,
			displayOrder: DISPLAY_ORDER.HUTON,
			requirements: [
				new Requirement({
					name: <Trans id="nin.huton.checklist.requirement.name"><ActionLink action="HUTON"/> uptime</Trans>,
					percent: () => uptime,
				}),
			],
			target: 99,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HUTON.icon,
			content: <Trans id="nin.huton.suggestions.clipping.content">
				Avoid using <ActionLink action="ARMOR_CRUSH"/> when <ActionLink action="HUTON"/> has more than 30 seconds left on its duration. The excess time is wasted, so using <ActionLink action="AEOLIAN_EDGE"/> is typically the better option.
			</Trans>,
			tiers: {
				15000: SEVERITY.MINOR,
				60000: SEVERITY.MEDIUM,
			},
			value: clipped,
			why: <Trans id="nin.huton.suggestions.clipping.why">
				You clipped {this.parser.formatDuration(clipped)} of Huton with early Armor Crushes.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ARMOR_CRUSH.icon,
			content: <Trans id="nin.huton.suggestions.futile-ac.content">
				Avoid using <ActionLink action="ARMOR_CRUSH"/> when <ActionLink action="HUTON"/> is down, as it provides no benefit and does less DPS than your other combo finishers.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
			},
			value: badAcs,
			why: <Trans id="nin.huton.suggestions.futile-ac.why">
				You used Armor Crush <Plural value={badAcs} one="# time" other="# times"/> when Huton was down.
			</Trans>,
		}))
	}
}
