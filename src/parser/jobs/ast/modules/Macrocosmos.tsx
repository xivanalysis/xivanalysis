import {Plural, Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter} from 'parser/core/filter'
import {dependency} from 'parser/core/Injectable'
import {Data} from 'parser/core/modules/Data'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Suggestions, SEVERITY, Suggestion, TieredSuggestion} from 'parser/core/modules/Suggestions'

const SEVERITY_MOD = {
	0.2: SEVERITY.MINOR,
	0.6: SEVERITY.MEDIUM,
	0.8: SEVERITY.MAJOR,
}

// Lifted from WHM benison and adapted to AST and TSX
export class Macrocosmos extends Analyser {
	static override handle = 'macrocosmos'

	@dependency private data!: Data
	@dependency private suggestions!: Suggestions
	@dependency private invulnerability!: Invulnerability

	private macrocosmosUses: number = 0

	override initialise() {
		this.addEventHook(filter<Event>()
			.source(this.parser.actor.id)
			.type('action')
			.action(this.data.actions.MACROCOSMOS.id), this.onMacrocosmosCast)
		this.addEventHook('complete', this.onComplete)
	}

	private onMacrocosmosCast() {
		this.macrocosmosUses++
	}

	private onComplete() {
		const macrocosmosMaxUses = Math.ceil((this.parser.pull.duration - - this.invulnerability.getDuration({types: ['invulnerable']})) / this.data.actions.MACROCOSMOS.cooldown)
		const macrocosmosPercentUsed = this.macrocosmosUses / macrocosmosMaxUses

		const generalContent =
			<Trans id="ast.macrocosmos.content.general">
				Consider utilizing <DataLink action="MACROCOSMOS" /> more frequently. <DataLink action="MACROCOSMOS" showIcon={false} /> has the same potency as <DataLink action="FALL_MALEFIC" />; however, <DataLink action="MACROCOSMOS" showIcon={false} /> can be utilized to weave in healing for incoming raid wide attacks leading to more value for your GCD. <br/>
			</Trans>

		const generalWhy =
			<Trans id="ast.macrocosmos.why.general">
				Out of a possible {macrocosmosMaxUses} <Plural value={macrocosmosMaxUses} one="cast" other="casts" /> during available dps uptime, there <Plural value={this.macrocosmosUses} one="was" other="were" /> {this.macrocosmosUses} <Plural value={this.macrocosmosUses} one="cast" other="casts" /> noted. <br />
			</Trans>

		const noCastWhy =<p><span className="text-error"><Trans id="ast.macrocosmos.why.nocasts">
			There were no casts recorded for <DataLink action="MACROCOSMOS" />.
		</Trans></span></p>

		if (this.macrocosmosUses === 0) {
			this.suggestions.add(new Suggestion({
				icon: this.data.actions.MACROCOSMOS.icon,
				content: generalContent,
				severity: SEVERITY.MAJOR,
				why: noCastWhy,
			}))
		} else {
			this.suggestions.add(new TieredSuggestion({
				icon: this.data.actions.MACROCOSMOS.icon,
				content: generalContent,
				tiers: SEVERITY_MOD,
				value: 1 - macrocosmosPercentUsed,
				why: generalWhy,
			}))
		}
	}
}
