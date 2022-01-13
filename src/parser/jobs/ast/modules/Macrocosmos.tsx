import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Cooldowns} from 'parser/core/modules/Cooldowns'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import Suggestions, {SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'
import React from 'react'

/**some notes for macrocosmos. Its potency is 250 and then 40% less (150 potency) for all other adds.
* it it noteworthy that fall malefic's potency is also 250 and that gravity II's potency is 130.
* therefore, macrocosmos for single targets would be only as useful as the delayed heal and the instant cast (similar to combust III)
* for multiple targets, macrocosmos would be best used on CD unless the AST is aware of any significant healing needed
* recommendations below will include gravity casts instead of macrocosmos and will show possible casts for the fight
**/

const SEVERITY_MOD = {
	GRAVITY: {
		1: SEVERITY.MINOR,
		3: SEVERITY.MEDIUM,
		10: SEVERITY.MAJOR,
	},
	NOTGRAVITY: {
		0.2: SEVERITY.MINOR,
		0.6: SEVERITY.MEDIUM,
		0.8: SEVERITY.MAJOR,
	},
}

const GCD_ALLOWANCE = 2500

// Lifted from WHM benison and adapted to AST and TSX
export class Macrocosmos extends Analyser {
	static override handle = 'macrocosmos'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private invulnerability!: Invulnerability
	@dependency private cooldowns!: Cooldowns

	private macrocosmosUses: number = 0
	private gravityIIUses: number = 0

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.MACROCOSMOS.id), this.onMacrocosmosCast)
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.GRAVITY_II.id), this.onGravityIICast)
		this.addEventHook('complete', this.onComplete)
	}

	private onMacrocosmosCast() {
		this.macrocosmosUses++
	}

	private onGravityIICast() {
		//check whether Macrocosmos is on CD. if not, then count it
		if (this.cooldowns.remaining('MACROCOSMOS') + GCD_ALLOWANCE > 0) {
			return
		}
		this.gravityIIUses++
	}

	private onComplete() {
		const macrocosmosMaxUses = Math.ceil((this.parser.pull.duration - - this.invulnerability.getDuration({types: ['invulnerable']})) / this.data.actions.MACROCOSMOS.cooldown)
		const macrocosmosPercentUsed = this.macrocosmosUses / macrocosmosMaxUses

		const gravityIIContent =
			<Trans id="ast.macrocosmos.content.multiple-target">
				<DataLink action="MACROCOSMOS" showIcon={false} /> has a higher potency per target than <DataLink action="GRAVITY_II" /> and <DataLink action="MACROCOSMOS" showIcon={false} /> should be utilized as much as possible in lieu of <DataLink action="GRAVITY_II" showIcon={false} />.
			</Trans>

		const generalContent =
			<Trans id="ast.macrocosmos.content.general">
				Consider utilizing <DataLink action="MACROCOSMOS" /> more frequently. <DataLink action="MACROCOSMOS" showIcon={false} /> has the same potency as <DataLink action="FALL_MALEFIC" />; however, <DataLink action="MACROCOSMOS" showIcon={false} /> can be utilized to weave in healing for incoming raid wide attacks leading to more value for your GCD. <br/>
			</Trans>

		const gravityIIWhy =
			<Trans id="ast.macrocosmos.why.multiple-target">
				There <Plural value={this.gravityIIUses} one="was" other="were" /> {this.gravityIIUses} <Plural value={this.gravityIIUses} one="cast" other="casts" /> noted for <DataLink action="GRAVITY_II" /> when <DataLink action="MACROCOSMOS" /> was available.
			</Trans>

		const generalWhy =
			<Trans id="ast.macrocosmos.why.general">
				Out of a possible {macrocosmosMaxUses} <Plural value={macrocosmosMaxUses} one="cast" other="casts" /> during available dps uptime, there <Plural value={this.macrocosmosUses} one="was" other="were" /> {this.macrocosmosUses} <Plural value={this.macrocosmosUses} one="cast" other="casts" /> noted. <br />
			</Trans>

		const noCastWhy =<p><span className="text-error"><Trans id="ast.macrocosmos.why.nocasts">
			There were no casts recorded for <DataLink action="MACROCOSMOS" />.
		</Trans></span></p>

		const content = this.gravityIIUses === 0 ? [generalContent] : [gravityIIContent]
		const why = this.macrocosmosUses === 0 ? [noCastWhy] : [generalWhy]
		this.gravityIIUses !== 0 ? why.push(gravityIIWhy) : ''

		if (this.macrocosmosUses === 0 && this.gravityIIUses === 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.MACROCOSMOS.icon,
				content: content,
				severity: SEVERITY.MAJOR,
				why: why,
			}))
		} else if (this.macrocosmosUses !== 0 && this.gravityIIUses === 0) {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.MACROCOSMOS.icon,
				content: content,
				tiers: SEVERITY_MOD.NOTGRAVITY,
				value: 1 - macrocosmosPercentUsed,
				why: why,
			}))
		} else {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.MACROCOSMOS.icon,
				content: content,
				tiers: SEVERITY_MOD.GRAVITY,
				value: this.gravityIIUses,
				why: why,
			}))
		}
	}
}
