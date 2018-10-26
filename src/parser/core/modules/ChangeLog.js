import {i18nMark} from '@lingui/react'
import React from 'react'

import {default as ChangeLogModule} from 'components/modules/ChangeLog'
import Module, {DISPLAY_ORDER} from 'parser/core/Module'

export default class ChangeLog extends Module {
	static handle = 'changelog'
	static displayOrder = DISPLAY_ORDER.BOTTOM

	static title = 'Changelog'
	static i18n_id = i18nMark('core.changelog.title')

	output() {
		const {changelog} = this.parser.meta

		if (changelog.length === 0) {
			return false
		}

		// Sorts the changelog by date. New to old.
		changelog.sort((a, b) => b.date - a.date)

		return <ChangeLogModule changelog={changelog}/>
	}
}
