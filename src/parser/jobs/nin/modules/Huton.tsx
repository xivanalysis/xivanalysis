import {Trans, Plural} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {CastEvent} from 'fflogs'
import {Event} from 'legacyEvent'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import {ComboEvent} from 'parser/core/modules/Combos'
import {Data} from 'parser/core/modules/Data'
import {Death} from 'parser/core/modules/Death'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import React, {Fragment} from 'react'
import {Icon, Message} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

const HUTON_MAX_DURATION_MILLIS = 70000 // Not in STATUSES/NIN.js because lolgauges

// TODO - Revisit how this sim works in the first place because it's fucky
const HUTON_START_DURATION_MILLIS_HIGH = 65000
const HUTON_START_DURATION_MILLIS_LOW = 59000

const HUTON_EXTENSION_AC = 30000
const HUTON_EXTENSION_HM = 10000

const HUTON_EXTENSION_MILLIS: Array<[ActionKey, number]> = [
	['ARMOR_CRUSH', HUTON_EXTENSION_AC],
	['HAKKE_MUJINSATSU', HUTON_EXTENSION_HM],
]

const DOWNTIME_DIFFERENCE_TOLERANCE = 10000 // If the downtime estimates are off by more than this, we can probably toss the low estimate

// Some bosses *coughChadarnookcough* require fucky pulls that result in your Huton timer being lower than normal when the fight starts
const BOSS_ADJUSTMENTS: {[key: number]: number} = {
	// [BOSSES.DEMON_CHADARNOOK.logId]: 15000,
}

interface HutonEstimate {
	current: number,
	clipped: number,
	downtime: number,
	badAcs: number,
}

export class Huton extends Module {
	static override handle = 'huton'

	@dependency private checklist!: Checklist
	@dependency private data!: Data
	@dependency private death!: Death
	@dependency private suggestions!: Suggestions

	private hutonExtensionMillis = new Map(HUTON_EXTENSION_MILLIS.map(
		pair => [this.data.actions[pair[0]].id, pair[1]]
	))

	private highEstimate: HutonEstimate = {
		current: HUTON_START_DURATION_MILLIS_HIGH - (BOSS_ADJUSTMENTS[this.parser.fight.boss] || 0),
		clipped: 0,
		downtime: 0,
		badAcs: 0,
	}
	private lowEstimate: HutonEstimate = {
		current: HUTON_START_DURATION_MILLIS_LOW - (BOSS_ADJUSTMENTS[this.parser.fight.boss] || 0),
		clipped: 0,
		downtime: 0,
		badAcs: 0,
	}
	private lastEventTime: number = this.parser.fight.start_time // This one is shared

	protected override init() {
		this.addEventHook('cast', {by: 'player', abilityId: this.data.actions.HUTON.id}, this.onHutonCast)
		this.addEventHook('combo', {by: 'player', abilityId: HUTON_EXTENSION_MILLIS.map(pair => this.data.actions[pair[0]].id)}, this.onHutonExtension)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('raise', {to: 'player'}, this.onRaise)
		this.addEventHook('complete', this.onComplete)
	}

	private handleHutonRecast(estimate: HutonEstimate, elapsedTime: number) {
		if (estimate.current === 0) {
			estimate.downtime += elapsedTime
		}

		estimate.current = HUTON_MAX_DURATION_MILLIS
	}

	private onHutonCast(event: CastEvent) {
		const elapsedTime = (event.timestamp - this.lastEventTime)
		this.handleHutonRecast(this.highEstimate, elapsedTime)
		this.handleHutonRecast(this.lowEstimate, elapsedTime)
		this.lastEventTime = event.timestamp
	}

	private handleHutonExtension(estimate: HutonEstimate, amount: number, elapsedTime: number) {
		let newDuration = estimate.current - elapsedTime
		if (newDuration <= 0) {
			estimate.current = 0
			estimate.downtime -= newDuration // Since it's negative, this is basically addition
			estimate.badAcs++
		} else {
			newDuration += amount
			estimate.clipped += Math.max(newDuration - HUTON_MAX_DURATION_MILLIS, 0)
			estimate.current = Math.min(newDuration, HUTON_MAX_DURATION_MILLIS)
		}
	}

	private onHutonExtension(event: ComboEvent) {
		const elapsedTime = (event.timestamp - this.lastEventTime)
		const action = this.data.getAction(event.ability.guid)
		if (action == null) { return }

		// The .get() should never be undefined but we must appease the ts lint gods
		const extension = this.hutonExtensionMillis.get(action.id) ?? 0 
		this.handleHutonExtension(this.highEstimate, extension, elapsedTime)
		this.handleHutonExtension(this.lowEstimate, extension, elapsedTime)
		this.lastEventTime = event.timestamp
	}

	private onDeath() {
		// RIP
		this.highEstimate.current = 0
		this.lowEstimate.current = 0
	}

	private onRaise(event: Event) {
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
				<Trans id="nin.huton.checklist.description"><ActionLink {...this.data.actions.HUTON}/> provides you with a 15% attack speed increase and as such is a <em>huge</em> part of a NIN's personal DPS. Do your best not to let it drop, and recover it as quickly as possible if it does.</Trans>
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
					name: <Trans id="nin.huton.checklist.requirement.name"><ActionLink {...this.data.actions.HUTON}/> uptime</Trans>,
					percent: () => uptime,
				}),
			],
			target: 99,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.HUTON.icon,
			content: <Trans id="nin.huton.suggestions.clipping.content">
				Avoid using <ActionLink {...this.data.actions.ARMOR_CRUSH}/> when <ActionLink {...this.data.actions.HUTON}/> has more than 40 seconds left on its duration. The excess time is wasted, so using <ActionLink {...this.data.actions.AEOLIAN_EDGE}/> is typically the better option.
			</Trans>,
			tiers: {
				5000: SEVERITY.MINOR,
				10000: SEVERITY.MEDIUM,
				20000: SEVERITY.MAJOR,
			},
			value: clipped,
			why: <Trans id="nin.huton.suggestions.clipping.why">
				You clipped {this.parser.formatDuration(clipped)} of Huton with early Armor Crushes.
			</Trans>,
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.ARMOR_CRUSH.icon,
			content: <Trans id="nin.huton.suggestions.futile-ac.content">
				Avoid using <ActionLink {...this.data.actions.ARMOR_CRUSH}/> when <ActionLink {...this.data.actions.HUTON}/> is down, as it provides no benefit and does less DPS than your other combo finishers.
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
