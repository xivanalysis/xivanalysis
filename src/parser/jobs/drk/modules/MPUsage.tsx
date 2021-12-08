import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {ActionKey} from 'data/ACTIONS'
import {Event, Events} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {EventHook} from 'parser/core/Dispatcher'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Actors} from 'parser/core/modules/Actors'
import {Data} from 'parser/core/modules/Data'
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'
import {isSuccessfulHit} from 'utilities'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

const SPENDER_COST = 3000
const MP_REGEN_PER_TICK = 200
const TICK_RATE = 3000

const DARK_ARTS_SPENDERS: ActionKey[] = [
	'EDGE_OF_SHADOW',
	'FLOOD_OF_SHADOW',
]

// Tiered suggestion severities
const SEVERITY_THE_BLACKEST_NIGHT = {
	1: SEVERITY.MEDIUM,
	2: SEVERITY.MAJOR,
}

const SEVERITY_WASTED_MP_ACTIONS = {
	1: SEVERITY.MINOR,
	2: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

export class MPUsage extends Analyser {
	static override handle = 'resourceanalyzer'
	static override title = t('drk.resourceanalyzer.title')`Resource Analyzer`
	static override displayOrder = DISPLAY_ORDER.RESOURCES

	@dependency private actors!: Actors
	@dependency private data!: Data
	@dependency private suggestions!: Suggestions

	/* eslint-disable @typescript-eslint/no-magic-numbers */
	private comboGenerators = new Map<number, number>([
		[this.data.actions.SYPHON_STRIKE.id, 600],
		[this.data.actions.STALWART_SOUL.id, 600],
	])
	private damageGenerators = new Map<number, number>([
		[this.data.actions.CARVE_AND_SPIT.id, 600],
	])
	private bloodWeaponGenerators = new Map<number, number>([
		[this.data.actions.HARD_SLASH.id, 600],
		[this.data.actions.SYPHON_STRIKE.id, 600],
		[this.data.actions.SOULEATER.id, 600],
		[this.data.actions.BLOODSPILLER.id, 600],
		[this.data.actions.QUIETUS.id, 600],
		[this.data.actions.UNMEND.id, 600],
		[this.data.actions.UNLEASH.id, 600],
		[this.data.actions.STALWART_SOUL.id, 600],
	])
	private deliriumGenerators = new Map<number, number>([
		[this.data.actions.BLOODSPILLER.id, 200],
		[this.data.actions.QUIETUS.id, 500],
	])
	/* eslint-enable @typescript-eslint/no-magic-numbers */

	private lastMPGeneration = 0
	private cappedTimestamp?: number
	private mpGeneratedOvercap = 0
	private mpRegenOvercap = 0
	private droppedTBNs = 0
	private overwriteDarkArts = 0
	private darkArts = false

	override initialise() {
		super.initialise()

		const playerFilter = filter<Event>().source(this.parser.actor.id)
		this.addEventHook(playerFilter.type('damage').cause(this.data.matchCauseActionId([...this.damageGenerators.keys()])), this.onGenerator(this.damageGenerators))
		this.addEventHook(filter<Event>().type('actorUpdate').actor(this.parser.actor.id), this.onActorUpdate)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.BLOOD_WEAPON.id), this.onApplyBloodWeapon)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.BLOOD_WEAPON.id), this.onRemoveBloodWeapon)

		this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.DELIRIUM.id), this.onApplyDelirium)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.DELIRIUM.id), this.onRemoveDelirium)

		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.BLACKEST_NIGHT.id), this.onRemoveBlackestNight)
		this.addEventHook(playerFilter.type('action').action(this.data.matchActionId(DARK_ARTS_SPENDERS)), () => this.darkArts = false)

		this.addEventHook('complete', this.onComplete)
	}

	private activeBloodWeaponHook?: EventHook<Events['damage']>
	private onApplyBloodWeapon() {
		this.activeBloodWeaponHook = this.addEventHook(filter<Event>().source(this.parser.actor.id).type('damage'), this.onGenerator(this.bloodWeaponGenerators))
	}
	private onRemoveBloodWeapon() {
		if (this.activeBloodWeaponHook != null) {
			this.removeEventHook(this.activeBloodWeaponHook)
			this.activeBloodWeaponHook = undefined
		}
	}

	private activeDeliriumHook?: EventHook<Events['damage']>
	private onApplyDelirium() {
		this.activeDeliriumHook = this.addEventHook(filter<Event>().source(this.parser.actor.id).type('damage'), this.onGenerator(this.deliriumGenerators))
	}
	private onRemoveDelirium() {
		if (this.activeDeliriumHook != null) {
			this.removeEventHook(this.activeDeliriumHook)
			this.activeDeliriumHook = undefined
		}
	}

	private onGenerator(modifiers: Map<number, number>) {
		return (event: Events['damage' | 'combo']) => {
			if (event.type === 'damage' && event.cause.type === 'action') {
				if (!isSuccessfulHit(event)) { return }
				this.lastMPGeneration = modifiers.get(event.cause.action) ?? 0
			}

			if (event.type === 'combo') {
				this.lastMPGeneration = modifiers.get(event.action) ?? 0
			}

			if (this.lastMPGeneration > this.actors.current.mp.maximum - this.actors.current.mp.current) {
				this.mpGeneratedOvercap += this.lastMPGeneration - (this.actors.current.mp.maximum - this.actors.current.mp.current)
			}
		}
	}

	private onActorUpdate(event: Events['actorUpdate']) {
		if (event.mp == null) { return }

		if (event.mp < this.actors.current.mp.maximum) {
			if (this.cappedTimestamp == null) { return }

			const timeSinceCapped = event.timestamp - this.cappedTimestamp
			this.mpRegenOvercap += Math.floor(timeSinceCapped / TICK_RATE) * MP_REGEN_PER_TICK
			this.cappedTimestamp = undefined
		} else {
			this.cappedTimestamp = event.timestamp
		}
	}

	private onRemoveBlackestNight(event: Events['statusRemove']) {
		if ((event.absorbed ?? 0) === 0) {
			this.droppedTBNs += 1
		} else {
			if (this.darkArts) {
				this.overwriteDarkArts += 1
			}
			this.darkArts = true
		}
	}

	private onComplete() {
		const wastedDarkArts = this.droppedTBNs + this.overwriteDarkArts
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.THE_BLACKEST_NIGHT.icon,
			content: <Trans id="drk.resourceanalyzer.blackestnight.content">
				When the shield from <DataLink action="THE_BLACKEST_NIGHT" /> is fully consumed you gain a Dark Arts proc, which allows free use of <DataLink action="EDGE_OF_SHADOW" /> or <DataLink action="FLOOD_OF_SHADOW" />.
				You should make sure each usage of <DataLink action="THE_BLACKEST_NIGHT" /> will fully consume the shield, and that you use each Dark Arts proc before using <DataLink action="THE_BLACKEST_NIGHT" /> again.
			</Trans>,
			tiers: SEVERITY_THE_BLACKEST_NIGHT,
			value: wastedDarkArts,
			why: <Trans id="drk.resourceanalyzer.blackestnight.why">
				You missed out on <Plural value={wastedDarkArts} one="# Dark Arts use" other="# Dark Arts uses" /> due to <DataLink action="THE_BLACKEST_NIGHT" showIcon={false} showTooltip={false} /> applications that did not consume the shield.
			</Trans>,
		}))

		const wastedMPActions = Math.floor((this.mpGeneratedOvercap + this.mpRegenOvercap) / SPENDER_COST)
		this.suggestions.add(new TieredSuggestion({
			icon: this.data.actions.EDGE_OF_SHADOW.icon,
			content: <Trans id="drk.resourceanalyzer.wastedmp.content">
				Your MP allows you to use <DataLink action="EDGE_OF_SHADOW"/>, a strong attack that gives you a persistent damage up buff, as well as the strong mitigation of <DataLink action="THE_BLACKEST_NIGHT"/>.
				Be sure to consistently use your MP so you can benefit from natural regeneration and MP gain from your main combo skills.
			</Trans>,
			tiers: SEVERITY_WASTED_MP_ACTIONS,
			value: wastedMPActions,
			why: <Trans id="drk.resourceanalyzer.wastedmp.why">
				You lost a total of <Plural value={wastedMPActions} one="# MP spending skill" other="# MP spending skills" /> from gaining MP over the cap or death.
			</Trans>,
		}))
	}
}
