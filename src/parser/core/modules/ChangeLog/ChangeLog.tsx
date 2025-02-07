import {t} from '@lingui/macro'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {default as ChangelogComponent} from './Component'

export default class ChangeLog extends Analyser {
	static override handle = 'changelog'
	static override displayOrder = DISPLAY_ORDER.CHANGELOG
	static override displayMode = DisplayMode.FULL

	static override title = t('core.changelog.title')`Changelog`

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
