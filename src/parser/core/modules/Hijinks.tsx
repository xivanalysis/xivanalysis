import {Trans} from '@lingui/react/macro'
import {getIsAprilFirst} from '..'
import {Analyser} from '../Analyser'
import {dependency} from '../Injectable'
import {Suggestions, SEVERITY, Suggestion} from './Suggestions'

export class Hijinks extends Analyser {
	static override handle = 'hijinks'

	@dependency private suggestions!: Suggestions

	override initialise() {
		if (getIsAprilFirst()) {
			this.addEventHook('complete', () => {
				this.suggestions.add(new Suggestion({
					// eslint-disable-next-line @typescript-eslint/no-require-imports
					icon: require('../../../data/avatar/Godbert.png'),
					severity: SEVERITY.MEMES,
					content: <Trans id="core.hijinks.crit-more.content">Godbert says you should crit more to do more damage!</Trans>,
					why: <Trans id="core.hijinks.crit-more.why">You wouldn't want to disappoint Godbert, would you?</Trans>,
				}
				))
			})
		}
	}

}
