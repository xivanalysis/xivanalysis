import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'

import React, {Fragment} from 'react'
import {Accordion, Icon, Message, List, Table} from 'semantic-ui-react'
import Module, {dependency} from 'parser/core/Module'
import {getDataBy} from 'data'
import STATUSES from 'data/STATUSES'
import ACTIONS from 'data/ACTIONS'
import Checklist, {Rule, TieredRule, Requirement, TARGET} from 'parser/core/modules/Checklist'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import NormalisedMessage from 'components/ui/NormalisedMessage'

// import styles from './Barrage.module.css'
import {ActionRoot} from 'data/ACTIONS/root'
import Util from './Util'
import {Data} from 'parser/core/modules/Data'
import {CastEvent, BuffEvent, DamageEvent} from 'fflogs'
import Combatants from 'parser/core/modules/Combatants'
import _ from 'lodash'
import {warning} from 'akkd/Message/Message.module.css'

// Arbitrary threshold (in ms) to accept that three damage events were from the same cast
const TRIPLE_HIT_THRESHOLD = 500

const BARRAGE_GCDS: Array<keyof ActionRoot> = [
	'BURST_SHOT',
	'CAUSTIC_BITE',
	'IRON_JAWS',
	'REFULGENT_ARROW',
	'STORMBITE',
]

const enum SeverityWeights {
	// a barrage that went unused
	DROPPED_BUFF = 5,

	// a barrage that dealt no damage
	GHOSTED = 5,

	// a barrage that wasn't used on refulgent arrow
	BAD_GCD = 4,

	// a barrage that overwrote a natural straight shot proc
	PROC_OVERWRITE = 2,

	// a barrage that was used outside of raging strikes
	UNALIGNED = 1,
}

const SEVERITY_TIERS = {
	// tslint:disable-next-line: no-magic-numbers
	[91-99]: TARGET.WARN,
	[100]: TARGET.SUCCESS,
}

interface BarrageInfo {
	dropped: boolean,
	badGcd: boolean,
	overwrite: boolean,
	unaligned: boolean,
}

interface BarrageWindow {
	// The timestamp when barrage was cast
	castTimestamp: number,

	// The timestamp when barrage expired
	expireTimestamp: number | undefined,

	// Up to three damage events following this barrage
	damageEvents: DamageEvent[],

	info: BarrageInfo,
}

export default class Barrage extends Module {
	static handle = 'barrage'
	static title = t('brd.barrage.title')`Barrage`
	static debug = true

	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private data!: Data
	@dependency private util!: Util

	private barrageHistory: BarrageWindow[] = []

	private BARRAGE_GCDS: number[] = []

	protected init() {
		this.BARRAGE_GCDS = BARRAGE_GCDS.map(key => this.data.actions[key].id)

		this.addEventHook('cast', {by: 'player', abilityId: this.data.actions.BARRAGE.id}, this.onBarrageCast)
		this.addEventHook('removebuff', {by: 'player', abilityId: this.data.statuses.BARRAGE.id}, this.onBarrageExpire)
		this.addEventHook('damage', {by: 'player', abilityId: this.BARRAGE_GCDS}, this.onStDamage)
		this.addEventHook('complete', this.onComplete)
	}

	private get activeBarrage(): BarrageWindow | undefined {
		const lastBarrage = _.last(this.barrageHistory)
		if (lastBarrage && lastBarrage.damageEvents.length <= 2) {
			return lastBarrage
		}
		return undefined
	}

	private onBarrageCast(event: CastEvent) {
		this.barrageHistory.push({
			castTimestamp: event.timestamp,
			expireTimestamp: undefined,
			damageEvents: [],
			info: {
				dropped: false,
				badGcd: false,
				overwrite: false,
				unaligned: false,
			},
		})
	}

	private onBarrageExpire(event: BuffEvent) {
		if (this.activeBarrage) {
			this.activeBarrage.expireTimestamp = event.timestamp
		}
	}

	private onStDamage(event: DamageEvent) {
		if (this.activeBarrage && this.activeBarrage.expireTimestamp) {
			this.activeBarrage.damageEvents.push(event)
		}
	}

	private get severity(): number {
		return 1
	}

	private onComplete() {
		// Ignore barrages with no expire timestamp (i.e., right at the end of the fight)
		this.barrageHistory = this.barrageHistory.filter(barrage => barrage.expireTimestamp !== undefined)

		if (this.barrageHistory.length === 0) {
			return
		}

		this.barrageHistory.map(barrage => {
			if (barrage.damageEvents[2] && barrage.damageEvents[0].timestamp + TRIPLE_HIT_THRESHOLD > barrage.damageEvents[2].timestamp) {
				// Successful triple hit
				const action = this.data.getAction(barrage.damageEvents[0].ability.guid)

				if (action !== this.data.actions.REFULGENT_ARROW) {
					// Barrage used on the wrong GCD
					barrage.info.badGcd = true
				}
				if (this.combatants.selected.hasStatus(this.data.statuses.STRAIGHT_SHOT_READY.id, barrage.castTimestamp - 1)) {
					// Barrage overwrote a straighter shot proc
					barrage.info.overwrite = true
				}
				if (!this.combatants.selected.hasStatus(this.data.statuses.RAGING_STRIKES.id, barrage.expireTimestamp)) {
					// Barrage used outside of raging
					barrage.info.unaligned = true
				}

			} else {
				// No triple hit, barrage went unused
				barrage.info.dropped = true
			}
		})

		const barrageAL = <ActionLink {...this.data.actions.BARRAGE} />

		this.checklist.add(new WeightedTieredRule({
			name: <Trans id="brd.barrage.checklist.default-name">Barrage usage</Trans>,
			description: <Trans id="brd.barrage.checklist.description">
				As Bard's strongest damage cooldown, make sure you get the most out of your {barrageAL} casts. More details in the MODULE LINK below.
			</Trans>,
			tiers: SEVERITY_TIERS,
			requirements: [
				new Requirement({
					name: <Trans id="brd.barrage.checklist.dealt-damage">{barrageAL}s that dealt damage</Trans>,
					percent: () => (100 - 100 * this.barrageHistory.filter(b => b.info.dropped).length / this.barrageHistory.length),
					weight: SeverityWeights.DROPPED_BUFF,
				}),
				new Requirement({
					name: <Trans id="brd.barrage.checklist.used-on-refulgent">{barrageAL}s used on <ActionLink {...this.data.actions.REFULGENT_ARROW}/></Trans>,
					percent: () => (100 - 100 * this.barrageHistory.filter(b => b.info.badGcd).length / this.barrageHistory.length),
					weight: SeverityWeights.BAD_GCD,
				}),
				new Requirement({
					name: <Trans id="brd.barrage.checklist.granted-refulgent">{barrageAL}s that granted <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY}/></Trans>,
					percent: () => (100 - 100 * this.barrageHistory.filter(b => b.info.overwrite).length / this.barrageHistory.length),
					weight: SeverityWeights.PROC_OVERWRITE,
				}),
				new Requirement({
					name: <Trans id="brd.barrage.checklist.aligned-barrage">{barrageAL}s aligned with <ActionLink {...this.data.actions.RAGING_STRIKES}/></Trans>,
					percent: () => (100 - 100 * this.barrageHistory.filter(b => b.info.unaligned).length / this.barrageHistory.length),
					weight: SeverityWeights.UNALIGNED,
				}),
			],
		}))
	}

	output() {
		return undefined
	}
}

/**
 * A WeightedTieredRule is a TieredRule where each requirement is assigned a weight
 * corresponding to its relative importance
 */
class WeightedTieredRule extends TieredRule {
	constructor(options: TODO) {
		super({...options})

		const totalWeight = this.requirements.reduce((acc, req) => acc + req.weight, 0)
		this.requirements.map(req => req.weight = req.weight / totalWeight)
	}

	public get percent(): number {
		return this.requirements.reduce((acc, req) => acc + (req.percent * req.weight), 0)
	}
}
