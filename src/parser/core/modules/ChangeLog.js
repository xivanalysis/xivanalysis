import {i18nMark} from '@lingui/react'
//import React from 'react'

import Module, {DISPLAY_ORDER} from 'parser/core/Module'

let _changeLog = []

export default class ChangeLog extends Module {

	static handle = 'changelog'
	static displayOrder = DISPLAY_ORDER.BOTTOM;

	static title = 'Changelog'
	static i18n_id = i18nMark('core.changelog.title')

	constructor(...args) {
		super(...args)

		_changeLog = [...this.parser.meta.changelog]
	}

	output() {
		return _changeLog.map((item, key) => {
			//const contributors = Array.from(Object.keys(item.contributors), k=>item.contributors[k])
			//console.log(`${item.date.toLocaleString()}, ${contributors[0].name} and ${item.changes}`)
		})
	}
}
