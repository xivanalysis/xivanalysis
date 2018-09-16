import React from 'react'
import {i18nMark} from '@lingui/react'

import Rule from './Rule'
import ChecklistComponent from 'components/modules/Checklist'
import Module from 'parser/core/Module'
import DISPLAY_ORDER from '../DISPLAY_ORDER'

export default class Checklist extends Module {
	static handle = 'checklist'
	static displayOrder = DISPLAY_ORDER.CHECKLIST
	static i18n_id = i18nMark('core.checklist.title')
	static title = 'Checklist'

	_rules = []

	add(rule) {
		if (!(rule instanceof Rule)) {
			console.error('TODO: This error message')
			return
		}

		this._rules.push(rule)
	}

	output() {
		const sortedRules = [...this._rules]
		sortedRules.sort((a, b) => a.displayOrder - b.displayOrder)
		return <ChecklistComponent rules={sortedRules}/>
	}
}
