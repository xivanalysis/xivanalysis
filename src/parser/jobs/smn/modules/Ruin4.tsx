import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import Invulnerability from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

const SEVERITY_STACK_COUNT = {
	1: SEVERITY.MEDIUM,
	5: SEVERITY.MAJOR,
}

const FURTHER_RUIN_PLAYER_ACTIONS = [
	ACTIONS.ASSAULT_I_AERIAL_SLASH.id,
	ACTIONS.ASSAULT_II_SLIIPSTREAM.id,
	ACTIONS.ASSAULT_I_CRIMSON_CYCLONE.id,
	ACTIONS.ASSAULT_II_FLAMING_CRUSH.id,
	// NOTE: Titan Egi Assualt I Earthen Armor does not generate a Further Ruin stack
	ACTIONS.ASSAULT_II_MOUNTAIN_BUSTER.id,
]

const FURTHER_RUIN_PET_ACTIONS = [
	ACTIONS.AERIAL_SLASH.id,
	ACTIONS.SLIPSTREAM.id,
	ACTIONS.CRIMSON_CYCLONE.id,
	ACTIONS.FLAMING_CRUSH.id,
	// NOTE: Titan Egi Assualt I does not generate a Further Ruin stack
	ACTIONS.MOUNTAIN_BUSTER.id,
]

const MAX_FURTHER_RUIN_COUNT = 4
const END_OF_FIGHT_LEEWAY = 5000

export default class Ruin4 extends Module {
	static handle = 'ruin4'
	static title = t('smn.ruin-iv.title')`Ruin IV`

	@dependency private suggestions!: Suggestions
	@dependency private invuln!: Invulnerability

	private currentStackCount = 0
	private earthenArmorCount = 0
	private overage = 0
	private playerSkillCount = 0
	private petSkillCount = 0

	protected init() {
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.RUIN_IV.id}, this.onRuin4)
		this.addHook('cast', {by: 'player', abilityId: ACTIONS.ASSAULT_I_EARTHEN_ARMOR.id}, this.onPlayerEarthenArmor)
		this.addHook('cast', {by: 'player', abilityId: FURTHER_RUIN_PLAYER_ACTIONS}, this.onPlayerOtherEgiAssault)
		this.addHook('cast', {by: 'pet', abilityId: FURTHER_RUIN_PET_ACTIONS}, this.onPetCast)
		this.addHook('death', {to: 'player'}, this.onDeath)
		this.addHook('complete', this.onComplete)
	}

	private onRuin4(event: CastEvent) {
		if (this.currentStackCount > 0) { this.currentStackCount-- }
	}

	private onPlayerEarthenArmor(event: CastEvent) {
		this.earthenArmorCount++
	}

	private onPlayerOtherEgiAssault(event: CastEvent) {
		// Do not flag for player skills used right at the end of the fight when the
		// pet may not have time to use the skill.
		const fightTimeRemaining = this.parser.fight.end_time - event.timestamp
		if (fightTimeRemaining > END_OF_FIGHT_LEEWAY) {
			this.playerSkillCount++
		}
	}

	private onPetCast(event: CastEvent) {
		if (this.invuln.getInvulnerableUptime('all', event.timestamp)) { return }

		this.petSkillCount++
		if (this.currentStackCount >= MAX_FURTHER_RUIN_COUNT) {
			this.overage++
		} else {
			this.currentStackCount++
		}
	}

	private onDeath() {
		this.currentStackCount = 0
	}

	private onComplete() {
		this.suggestions.add(new TieredSuggestion({
			icon: STATUSES.FURTHER_RUIN.icon,
			content: <Trans id="smn.ruin-iv.overage.content">
				Do not use Egi Assault skills when already at the maximum number of <ActionLink {...STATUSES.FURTHER_RUIN}/> stacks.
			</Trans>,
			tiers: SEVERITY_STACK_COUNT,
			value: this.overage,
			why: <Trans id="smn.ruin-iv.overage.why">
				{this.overage} Further Ruin <Plural value={this.overage} one="stack was" other="stacks were"/> lost.
			</Trans>,
		}))

		let numberLost = this.earthenArmorCount
		if (this.playerSkillCount > this.petSkillCount) {
			numberLost += this.playerSkillCount - this.petSkillCount
		}
		this.suggestions.add(new TieredSuggestion({
			icon: STATUSES.FURTHER_RUIN.icon,
			content: <Trans id="smn.ruin-iv.lost.content">
				Use Egi Assault skills in a way that will generate stacks of <ActionLink {...STATUSES.FURTHER_RUIN}/>.
				Egi Assaults will not generate a stack if used against targets that die or become invincible or if a new
				pet is summoned before the assault is executed.  Titan-Egi's <ActionLink {...ACTIONS.ASSAULT_I_EARTHEN_ARMOR}/>
				does not generate a Further Ruin stack.
			</Trans>,
			tiers: SEVERITY_STACK_COUNT,
			value: numberLost,
			why: <Trans id="smn.ruin-iv.lost.why">
				{numberLost} Further Ruin <Plural value={numberLost} one="stack was" other="stacks were"/> not generated.
			</Trans>,
		}))

		if (this.currentStackCount > 0) {
			this.suggestions.add(new Suggestion({
				icon: STATUSES.FURTHER_RUIN.icon,
				severity: SEVERITY.MINOR,
				content: <Trans id="smn.ruin-iv.leftover.content">
					You should use all stacks of <ActionLink {...STATUSES.FURTHER_RUIN}/> before the end of the fight.
				</Trans>,
				why: <Trans id="smn.ruin-iv.leftover.why">
					{this.currentStackCount} Further Ruin <Plural value={this.currentStackCount} one="stack was" other="stacks were"/> left unused at the end of the fight.
				</Trans>,
			}))
		}
	}
}
