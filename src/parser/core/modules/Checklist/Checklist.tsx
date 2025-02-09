import {t} from '@lingui/macro'
import {Analyser, DisplayMode} from 'parser/core/Analyser'
import {DISPLAY_ORDER} from '../DISPLAY_ORDER'
import {Checklist as ChecklistComponent} from './Component'
import {Rule} from './Rule'

export class Checklist extends Analyser {
	static override handle = 'checklist'
	static override title = t('core.checklist.title')`Checklist`
	static override displayOrder = DISPLAY_ORDER.CHECKLIST
	static override displayMode = DisplayMode.FULL

	private rules: Rule[] = []

	add(rule: Rule) {
		if (!(rule instanceof Rule)) {
			throw new Error('Invalid rule provided to checklist.')
		}

		this.rules.push(rule)
	}

	override output() {
		const sortedRules = [...this.rules]
		sortedRules.sort((a, b) => a.displayOrder - b.displayOrder)
		return <ChecklistComponent rules={sortedRules}/>
	}
}
