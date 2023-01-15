import {Event} from 'event'
import {Analyser} from 'parser/core/Analyser'
import {filter, oneOf} from 'parser/core/filter'
import {executeBeforeDoNotUseOrYouWillBeFired} from 'parser/core/Injectable'
import {Invulnerability} from 'parser/core/modules/Invulnerability'
import {Actor, ReportMetaKey} from 'report'

/*
Yeah, there's a bit of a story to this one.

For some unknown reason, on _some_ reports of this fight, the first 1-2 action
events on initial pull will target a second instance of the boss that is then
unused for the rest of the fight. Unlike most other cases of weird-actors-that-
fuck-over-the-invulnerability-module, this second instance shares the `kind`
value with the real boss, which makes it near-impossible to fix with the
invulnerability module itself.

Rather than taking a Dwarven Mythril Hammer to the issue and adding an event
adapter step, I've written a horriffic little hack here that applies only to this
encounter. Fun times!

In short, this analyser will find all actors of the actor kind used by the actual
boss itself, then dangerously just... mutate the event. Because technically, you
can do that! Please do not actually do this ever unless you're actually insane
and ask me first. It's a hack.
*/

const actorKind: Record<ReportMetaKey, Actor['kind']> = {
	legacyFflogs: '15756',
}

// This MUST execute before invulnerability to ensure that the correct targets
// are set at that point in time. Feel free to add further run-before modules
// here to resolve dodgy issues created by this dodgy hack. Should be fine though. Right?
@executeBeforeDoNotUseOrYouWillBeFired(Invulnerability)
export class RetargetPull extends Analyser {
	static override handle = 'retargetPull'

	override initialise() {
		// Get the list of actors of the target's kind.
		const kind = actorKind[this.parser.report.meta.source]
		const actors = this.parser.pull.actors
			.filter(actor => actor.kind === kind)
			.map(actor => actor.id)

		// If there isn't 2 or more of them, there's nothing to merge, noop.
		if (actors.length < 2) {
			return
		}

		// Pick the first actor's ID as the target, and mutate every event targeting
		// any of the other IDs to that initial one. Yuck.
		// Enforced by conditional above.
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const mergeTarget = actors.shift()!
		this.addEventHook(
			filter<Event>().target(oneOf(actors)),
			event => { event.target = mergeTarget }
		)
	}

}
