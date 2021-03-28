import {t} from '@lingui/macro'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import React from 'react'
import DISPLAY_ORDER from '../DISPLAY_ORDER'
import {default as ChangelogComponent} from './Component'

export default class ChangeLog extends Analyser {
	static handle = 'changelog'
	static displayOrder = DISPLAY_ORDER.CHANGELOG
	static displayMode = DisplayMode.FULL

	static title = t('core.changelog.title')`Changelog`

	output() {
		const {changelog} = this.parser.meta

		if (changelog.length === 0) {
			return false
		}

		// Sorts the changelog by date. New to old.
		changelog.sort((a, b) => b.date.valueOf() - a.date.valueOf())

		return <ChangelogComponent changelog={changelog}/>
	}
}
