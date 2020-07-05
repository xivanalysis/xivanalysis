import {t} from '@lingui/macro'
import React from 'react'

import {default as ChangelogComponent} from './Component'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

export default class ChangeLog extends Module {
	static handle = 'changelog'
	static displayOrder = DISPLAY_ORDER.CHANGELOG
	static displayMode = DISPLAY_MODE.FULL

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
