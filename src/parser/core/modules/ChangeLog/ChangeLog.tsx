import {msg} from '@lingui/core/macro'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import {DISPLAY_ORDER} from '../DISPLAY_ORDER'
import {ChangeLog as ChangelogComponent} from './Component'

export class ChangeLog extends Analyser {
	static override handle = 'changelog'
	static override displayOrder = DISPLAY_ORDER.CHANGELOG
	static override displayMode = DisplayMode.FULL

	static override title = msg({id: 'core.changelog.title', message: 'Changelog'})

	override output() {
		const {changelog} = this.parser.meta

		if (changelog.length === 0) {
			return false
		}

		// Sorts the changelog by date. New to old.
		changelog.sort((a, b) => b.date.valueOf() - a.date.valueOf())

		return <ChangelogComponent changelog={changelog}/>
	}
}
