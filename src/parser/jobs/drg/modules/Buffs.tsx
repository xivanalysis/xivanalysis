import React, {Fragment} from 'react'
import {t} from '@lingui/macro'
import {Trans, Plural} from '@lingui/react'
import {CastEvent} from 'fflogs'
import {Accordion} from 'semantic-ui-react'

import ACTIONS, {Action} from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {ActionLink} from 'components/ui/DbLink'
import Module, {dependency} from 'parser/core/Module'
import Checklist, {Rule, Requirement} from 'parser/core/modules/Checklist'
import Suggestions, {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import Combatants from 'parser/core/modules/Combatants'
import {EntityStatuses} from 'parser/core/modules/EntityStatuses'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Data} from 'parser/core/modules/Data'
import DISPLAY_ORDER from './DISPLAY_ORDER'
import DragonSight from './DragonSight'
import LanceCharge from './LanceCharge'
import BattleLitany from './BattleLitany'

const BAD_LIFE_SURGE_CONSUMERS: number[] = [
	ACTIONS.TRUE_THRUST.id,
	ACTIONS.RAIDEN_THRUST.id,
	ACTIONS.VORPAL_THRUST.id,
	ACTIONS.DISEMBOWEL.id,
	ACTIONS.CHAOS_THRUST.id,
	ACTIONS.PIERCING_TALON.id,
	ACTIONS.DOOM_SPIKE.id,
	ACTIONS.SONIC_THRUST.id,
	ACTIONS.COERTHAN_TORMENT.id,
]

const FINAL_COMBO_HITS: number[] = [
	ACTIONS.FANG_AND_CLAW.id,
	ACTIONS.WHEELING_THRUST.id,
]

export default class Buffs extends Module {
	static handle = 'buffs'
	static title = t('drg.buffs.title')`Buffs`
	static displayOrder = DISPLAY_ORDER.BUFFS

	private badLifeSurges: number = 0
	private fifthGcd: boolean = false

	@dependency private checklist!: Checklist
	@dependency private combatants!: Combatants
	@dependency private entityStatuses!: EntityStatuses
	@dependency private invuln!: Invulnerability
	@dependency private suggestions!: Suggestions
	@dependency private data!: Data

	// buff window rendering
	@dependency private lanceCharge!: LanceCharge
	@dependency private dragonSight!: DragonSight
	@dependency private battleLitany!: BattleLitany


	init(){
		this.addEventHook('cast', {by: 'player'}, this.onCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onCast(event: CastEvent) {
		const action = this.data.getAction(event.ability.guid)
		if (action && action.onGcd) {
			if (BAD_LIFE_SURGE_CONSUMERS.includes(action.id)) {
				this.fifthGcd = false // Reset the 4-5 combo hit flag on other GCDs
				if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
					this.badLifeSurges++
				}
			} else if (FINAL_COMBO_HITS.includes(action.id)) {
				if (!this.fifthGcd) {
					// If we get 2 of these in a row (4-5 combo hits), only the first one is considered bad, so set a flag to ignore the next one
					this.fifthGcd = true
					if (this.combatants.selected.hasStatus(STATUSES.LIFE_SURGE.id)) {
						this.badLifeSurges++
					}
				}
			}
		}
	}

	private getDisembowelUptimePercent() {
		const statusUptime = this.entityStatuses.getStatusUptime(STATUSES.DISEMBOWEL.id, this.combatants.getEntities())
		const fightUptime = this.parser.currentDuration - this.invuln.getInvulnerableUptime()
		return (statusUptime / fightUptime) * 100
	}

	private onComplete() {
		this.checklist.add(new Rule({
			name: <Trans id="drg.buffs.checklist.name">Keep {ACTIONS.DISEMBOWEL.name} up</Trans>,
			description: <Trans id="drg.buffs.checklist.description">
				<ActionLink {...ACTIONS.DISEMBOWEL}/> provides a 10% boost to your personal damage and should always be kept up.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DISEMBOWEL,
			requirements: [
				new Requirement({
					name: <Trans id="drg.buffs.checklist.requirement.name"><ActionLink {...ACTIONS.DISEMBOWEL}/> uptime</Trans>,
					percent: () => this.getDisembowelUptimePercent(),
				}),
			],
		}))

		this.suggestions.add(new TieredSuggestion({
			icon: ACTIONS.LIFE_SURGE.icon,
			content: <Trans id="drg.buffs.suggestions.life-surge.content">
				Avoid using <ActionLink {...ACTIONS.LIFE_SURGE}/> on any GCD that isn't <ActionLink {...ACTIONS.FULL_THRUST}/> or a 5th combo hit. Any other combo action will have significantly less potency, losing a lot of the benefit of the guaranteed crit.
			</Trans>,
			tiers: {
				1: SEVERITY.MINOR,
				2: SEVERITY.MEDIUM,
				4: SEVERITY.MAJOR,
			},
			value: this.badLifeSurges,
			why: <Trans id="drg.buffs.suggestions.life-surge.why">
				You used {ACTIONS.LIFE_SURGE.name} on a non-optimal GCD <Plural value={this.badLifeSurges} one="# time" other="# times"/>.
			</Trans>,
		}))
	}

	output() {
		const buffPanels = [
			{
				title: {
					key: 'title-lc',
					content: <Trans id="drg.buffs.lance-charge.header">Lance Charge</Trans>,
				},
				content: {
					key: 'content-lc',
					content: this.lanceCharge.renderTable(),
				},
			},
			{
				title: {
					key: 'title-ds',
					content: <Trans id="drg.buffs.dragon-sight.header">Dragon Sight</Trans>,
				},
				content: {
					key: 'content-ds',
					content: this.dragonSight.renderTable(),
				},
			},
			{
				title: {
					key: 'title-bl',
					content: <Trans id="drg.buffs.battle-lit.header">Battle Litany</Trans>,
				},
				content: {
					key: 'content-bl',
					content: this.battleLitany.renderTable(),
				},
			},
		]

		return <Fragment>
			<Accordion exclusive={false} panels={buffPanels} styled fluid />
		</Fragment>
	}
}
