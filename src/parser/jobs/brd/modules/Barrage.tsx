import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import _ from 'lodash'
import React from 'react'
import {Icon, Table} from 'semantic-ui-react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {ActionRoot} from 'data/ACTIONS/root'
import {CastEvent, BuffEvent, DamageEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Rule, TieredRule, Requirement, TARGET} from 'parser/core/modules/Checklist'
import Combatants from 'parser/core/modules/Combatants'
import {Data} from 'parser/core/modules/Data'
import {NormalisedDamageEvent} from 'parser/core/modules/NormalisedEvents'
import Util from './Util'

import DISPLAY_ORDER from './DISPLAY_ORDER'

const BARRAGE_GCDS: Array<keyof ActionRoot> = [
	'BURST_SHOT',
	'CAUSTIC_BITE',
	'IRON_JAWS',
	'REFULGENT_ARROW',
	'STORMBITE',
]

enum SeverityWeights {
	// a barrage that went unused
	DROPPED_BUFF = 4,

	// a barrage that wasn't used on refulgent arrow
	BAD_GCD = 3,

	// a barrage that overwrote a natural straight shot proc
	PROC_OVERWRITE = 2,

	// a barrage that was used outside of raging strikes
	UNALIGNED = 1,
}

const SEVERITY_TIERS = {
	// tslint:disable-next-line: no-magic-numbers
	[90]: TARGET.WARN,
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

	// The single target hits following a barraged GCD
	damageEvent: NormalisedDamageEvent | undefined,

	info: BarrageInfo,
}

export default class Barrage extends Module {
	static handle = 'barrage'
	static title = t('brd.barrage.title')`Barrage`
	static displayOrder = DISPLAY_ORDER.BARRAGE

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
		this.addEventHook('normaliseddamage', {by: 'player', abilityId: this.BARRAGE_GCDS}, this.onStDamage)
		this.addEventHook('complete', this.onComplete)
	}

	private get activeBarrage(): BarrageWindow | undefined {
		const lastBarrage = _.last(this.barrageHistory)
		if (lastBarrage && !lastBarrage.expireTimestamp) {
			return lastBarrage
		}
		return undefined
	}

	private onBarrageCast(event: CastEvent) {
		this.barrageHistory.push({
			castTimestamp: event.timestamp,
			expireTimestamp: undefined,
			damageEvent: undefined,
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

	private onStDamage(event: NormalisedDamageEvent) {
		if (this.activeBarrage && this.BARRAGE_GCDS.includes(event.ability.guid)) {
			this.activeBarrage.damageEvent = event
		}
	}

	private onComplete() {
		// Ignore barrages with no expire timestamp (i.e., right at the end of the fight)
		this.barrageHistory = this.barrageHistory.filter(barrage => barrage.expireTimestamp !== undefined)

		this.barrageHistory.map(barrage => {
			if (!barrage.damageEvent || barrage.damageEvent.finalizedAmount === 0) {
				barrage.info.dropped = true

			} else {
				// Successful triple hit
				const action = this.data.getAction(barrage.damageEvent.ability.guid)

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
			}
		})

		const barrageAL = <ActionLink {...this.data.actions.BARRAGE} />

		const moduleLink = <a
			style={{cursor: 'pointer'}}
			onClick={() => this.parser.scrollTo(Barrage.handle)}><NormalisedMessage message={Barrage.title}/>
		</a>

		if (this.barrageHistory.length > 0) {
			this.checklist.add(new WeightedTieredRule({
				name: <Trans id="brd.barrage.checklist.default-name">Barrage usage</Trans>,
				description: <Trans id="brd.barrage.checklist.description">
					As Bard's strongest damage cooldown, make sure you get the most out of your {barrageAL} casts. More details in the {moduleLink} module below.
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

		} else {
			this.checklist.add(new Rule({
				name: <Trans id="brd.barrage.no-barrage-checklist.name">No Barrage usage</Trans>,
				description: <Trans id="brd.barrage.no-barrage-checklist.description">{barrageAL} into <ActionLink {...this.data.actions.REFULGENT_ARROW}/> is Bard's strongest damage cooldown. Make sure to use it during a fight.</Trans>,
				target: 95,
				requirements: [
					new Requirement({
						name: <Trans id="brd.barrage.no-barrage-checklist.no-barrage-cast">{barrageAL}s cast</Trans>,
						percent: () => 0,
					}),
				],
			}))
		}
	}

	private getIcon(failed: boolean): JSX.Element {
		if (failed) {
			return <Icon name="remove" className="text-error"/>
		} else {
			return <Icon name="checkmark" className="text-success"/>
		}
	}

	output() {
		if (this.barrageHistory.length === 0) {
			return null
		}

		return <Table collapsing>
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell><Trans id="brd.barrage.table.header.time">Time</Trans></Table.HeaderCell>
					<Table.HeaderCell><Trans id="brd.barrage.table.header.dealt-damage">Dealt Damage?</Trans></Table.HeaderCell>
					<Table.HeaderCell>
						<Trans id="brd.barrage.table.header.used-on-refulgent">Used on <ActionLink {...this.data.actions.REFULGENT_ARROW}/>?</Trans>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<Trans id="brd.barrage.table.header.granted-refulgent">Granted <StatusLink {...this.data.statuses.STRAIGHT_SHOT_READY}/>?</Trans>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<Trans id="brd.barrage.table.header.aligned">Aligned with <StatusLink {...this.data.statuses.RAGING_STRIKES}/>?</Trans>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
			{
				this.barrageHistory.map(barrage => {
					return <Table.Row key={barrage.castTimestamp} warning={barrage.info.dropped}>
						<Table.Cell>{this.util.createTimelineButton(barrage.castTimestamp)}</Table.Cell>
						<Table.Cell textAlign="center">{this.getIcon(barrage.info.dropped)}</Table.Cell>
						<Table.Cell textAlign="center">{this.getIcon(barrage.info.dropped || barrage.info.badGcd)}</Table.Cell>
						<Table.Cell textAlign="center">{this.getIcon(barrage.info.dropped || barrage.info.overwrite)}</Table.Cell>
						<Table.Cell textAlign="center">{this.getIcon(barrage.info.dropped || barrage.info.unaligned)}</Table.Cell>
					</Table.Row>
				})
			}
			</Table.Body>
		</Table>
	}
}

/**
 * A WeightedTieredRule is a TieredRule where each requirement has a weight
 * corresponding to its relative importance toward the rule
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
