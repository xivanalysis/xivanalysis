import React from 'react'
import {i18nMark} from '@lingui/react'

import Rule from './Rule'
import ChecklistComponent from 'components/modules/Checklist'
import Module, {DISPLAY_ORDER} from 'parser/core/Module'

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
		return <ChecklistComponent rules={this._rules}/>
	}
}
