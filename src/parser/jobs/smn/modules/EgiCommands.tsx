import {t} from '@lingui/macro'
import {Plural, Trans} from '@lingui/react'
import {ActionLink, StatusLink} from 'components/ui/DbLink'
import {RotationTable} from 'components/ui/RotationTable'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {AbilityType, CastEvent} from 'fflogs'
import Module, {dependency} from 'parser/core/Module'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {Timeline} from 'parser/core/modules/Timeline'
import React from 'react'
import {Event} from 'events'

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
	ACTIONS.SMN_MOUNTAIN_BUSTER.id,
]

const NON_FURTHER_RUIN_PLAYER_ACTIONS = [
	ACTIONS.ASSAULT_I_EARTHEN_ARMOR.id,
	ACTIONS.ENKINDLE_AERIAL_BLAST.id,
	ACTIONS.ENKINDLE_INFERNO.id,
	ACTIONS.ENKINDLE_EARTHEN_FURY.id,
	ACTIONS.SMN_AETHERPACT.id,
]

const NON_FURTHER_RUIN_PET_ACTIONS = [
	ACTIONS.EARTHEN_ARMOR.id,
	ACTIONS.AERIAL_BLAST.id,
	ACTIONS.INFERNO.id,
	ACTIONS.EARTHEN_FURY.id,
	ACTIONS.DEVOTION.id,
]

const PLAYER_TO_PET_MAP = {
	[ACTIONS.ASSAULT_I_AERIAL_SLASH.id]: ACTIONS.AERIAL_SLASH.id,
	[ACTIONS.ASSAULT_II_SLIIPSTREAM.id]: ACTIONS.SLIPSTREAM.id,
	[ACTIONS.ASSAULT_I_CRIMSON_CYCLONE.id]: ACTIONS.CRIMSON_CYCLONE.id,
	[ACTIONS.ASSAULT_II_FLAMING_CRUSH.id]: ACTIONS.FLAMING_CRUSH.id,
	[ACTIONS.ASSAULT_I_EARTHEN_ARMOR.id]: ACTIONS.EARTHEN_ARMOR.id,
	[ACTIONS.ASSAULT_II_MOUNTAIN_BUSTER.id]: ACTIONS.SMN_MOUNTAIN_BUSTER.id,
	[ACTIONS.ENKINDLE_AERIAL_BLAST.id]: ACTIONS.AERIAL_BLAST.id,
	[ACTIONS.ENKINDLE_INFERNO.id]: ACTIONS.INFERNO.id,
	[ACTIONS.ENKINDLE_EARTHEN_FURY.id]: ACTIONS.EARTHEN_FURY.id,
	[ACTIONS.SMN_AETHERPACT.id]: ACTIONS.DEVOTION.id,
}

const MAX_FURTHER_RUIN_COUNT = 4
const EXPECTED_BAHAMUT_SUMMON_STACKS = 4
const END_OF_FIGHT_LEEWAY = 5000

class UnexecutedCommands {
	swapTimestamp: number = 0
	commands: CastEvent[] = []
}

export default class EgiCommands extends Module {
	static handle = 'egicommands'
	static title = t('smn.egicommands.title')`Unexecuted Egi Commands`

	@dependency private suggestions!: Suggestions
	@dependency private timeline!: Timeline
	@dependency private invuln!: Invulnerability

	private currentStackCount = 0
	private bahamutMissingStackCount = 0
	private earthenArmorCount = 0
	private overage = 0
	private playerSkillCount = 0
	private petSkillCount = 0

	private activeCommands: CastEvent[] = []
	private unexecutedCommands: UnexecutedCommands[] = []

	protected init() {
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.RUIN_IV.id}, this.onRuin4)
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.SUMMON_BAHAMUT.id}, this.onSummonBahamut)
		this.addEventHook('cast', {by: 'player', abilityId: ACTIONS.ASSAULT_I_EARTHEN_ARMOR.id}, this.onPlayerEarthenArmor)
		this.addEventHook('cast', {by: 'player', abilityId: FURTHER_RUIN_PLAYER_ACTIONS}, this.onPlayerOtherEgiAssault)
		this.addEventHook('cast', {by: 'pet', abilityId: FURTHER_RUIN_PET_ACTIONS}, this.onPetCast)
		this.addEventHook('cast', {by: 'player', abilityId: NON_FURTHER_RUIN_PLAYER_ACTIONS}, this.onCommandIssued)
		this.addEventHook('cast', {by: 'pet', abilityId: NON_FURTHER_RUIN_PET_ACTIONS}, this.onCommandExecuted)
		this.addEventHook('summonpet', this.onChangePet)
		this.addEventHook('death', {to: 'player'}, this.onDeath)
		this.addEventHook('complete', this.onComplete)
	}

	private onRuin4(event: CastEvent) {
		if (this.currentStackCount > 0) { this.currentStackCount-- }
	}

	private onSummonBahamut(event: CastEvent) {
		if (this.currentStackCount < EXPECTED_BAHAMUT_SUMMON_STACKS) { this.bahamutMissingStackCount++ }
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
			this.onCommandIssued(event)
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

		this.onCommandExecuted(event)
	}

	private onCommandIssued(event: CastEvent) {
		// Ignore fabricated casts
		if (event.ability.type === AbilityType.SPECIAL) { return }

		this.activeCommands.push(event)
		this.debug(`Issued ${event.ability.name} at ${this.parser.formatTimestamp(event.timestamp)} (${event.timestamp}). ${this.activeCommands.length} commands now pending.`)
	}

	private onCommandExecuted(event: CastEvent) {
		const index = this.activeCommands.findIndex(command => PLAYER_TO_PET_MAP[command.ability.guid] === event.ability.guid)
		this.debug(`Executed ${event.ability.name} at ${this.parser.formatTimestamp(event.timestamp)} (${event.timestamp}). Position ${index} of ${this.activeCommands.length} active commands.`)
		if (index < 0) { return }

		this.activeCommands.splice(index, 1)
	}

	private onChangePet(event: Event)	{
		const ghostedCommands = this.activeCommands.filter(command => command.timestamp < event.timestamp)

		if (ghostedCommands.length === 0) { return }

		this.debug(`Swapped pet at ${this.parser.formatTimestamp(event.timestamp)} (${event.timestamp}).  ${ghostedCommands.length} commands lost.`)
		this.unexecutedCommands.push({
			swapTimestamp: event.timestamp,
			commands: ghostedCommands,
		})
		this.activeCommands = this.activeCommands.filter(command => command.timestamp >= event.timestamp)
	}

	private onDeath() {
		this.currentStackCount = 0
		this.activeCommands = []
	}

	private onComplete() {
		if (this.bahamutMissingStackCount > 0) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.SUMMON_BAHAMUT.icon,
				severity: SEVERITY.MINOR,
				content: <Trans id="smn.ruin-iv.bahamut.content">
					Ensure you have 4 stacks of <StatusLink {...STATUSES.FURTHER_RUIN}/> when summoning Bahamut.
					All 4 stacks will be needed to get the maximum value from Bahamut.
				</Trans>,
				why: <Trans id="smn.ruin-iv.bahamut.why">
					Bahamut was summoned without enough stacks <Plural value={this.bahamutMissingStackCount} one="# time" other="# times"/>.
				</Trans>,
			}))
		}

		this.suggestions.add(new TieredSuggestion({
			icon: STATUSES.FURTHER_RUIN.icon,
			content: <Trans id="smn.ruin-iv.overage.content">
				Do not use Egi Assault skills when already at the maximum number of <StatusLink {...STATUSES.FURTHER_RUIN}/> stacks.
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
				Use Egi Assault skills in a way that will generate stacks of <StatusLink {...STATUSES.FURTHER_RUIN}/>.
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
					You should use all stacks of <StatusLink {...STATUSES.FURTHER_RUIN}/> before the end of the fight.
				</Trans>,
				why: <Trans id="smn.ruin-iv.leftover.why">
					{this.currentStackCount} Further Ruin <Plural value={this.currentStackCount} one="stack was" other="stacks were"/> left unused at the end of the fight.
				</Trans>,
			}))
		}
	}

	output() {
		if (this.unexecutedCommands.length === 0) { return false }

		return <RotationTable data={this.unexecutedCommands
			.map(pet => {
				return {
					start: pet.commands[0].timestamp - this.parser.fight.start_time,
					end: pet.swapTimestamp - this.parser.fight.start_time,
					rotation: pet.commands,
				}
			})
		}
		onGoto={this.timeline.show}
		/>
	}

}
