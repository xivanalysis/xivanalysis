import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {Message, Segment} from 'akkd'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import ACTIONS from 'data/ACTIONS'
import Module, {DISPLAY_MODE} from 'parser/core/Module'
import React from 'react'
import {Table} from 'semantic-ui-react'
import DISPLAY_ORDER from './DISPLAY_ORDER'

interface Trigger {
	module: typeof Module
	reason?: React.ReactNode
}

const EXPECTED_ABILITY_EVENTS = [
	'begincast',
	'cast',
	'damage',
	'heal',
	'applybuff',
	'applydebuff',
	'refreshbuff',
	'refreshdebuff',
	'removebuff',
	'removedebuff',
	'applybuffstack',
	'applydebuffstack',
	'removebuffstack',
	'removedebuffstack',
]

export default class BrokenLog extends Module {
	static handle = 'brokenLog'
	static title = t('core.broken-log.title')`Broken Log`
	static displayOrder = DISPLAY_ORDER.BROKEN_LOG
	static displayMode = DISPLAY_MODE.RAW

	private triggers = new Map<string, Trigger>()

	init() {
		// Unknown actions are unparseable
		this.addHook(
			EXPECTED_ABILITY_EVENTS,
			{by: 'player', abilityId: ACTIONS.UNKNOWN.id},
			() => {
				this.trigger(this, 'unknown action', (
					<Trans id="core.broken-log.trigger.unknown-action">
						One or more actions were recorded incorrectly, and could not be parsed.
					</Trans>
				))
			},
		)
	}

	/**
	 * Trigger the module to display the broken log error.
	 * @param key Unique key that represents the BL trigger
	 * @param module Module that is triggering BL
	 * @param reason Short description of why BL was triggered
	 */
	trigger(module: Module, key: string, reason?: React.ReactNode) {
		const constructor = (module.constructor as typeof Module)
		this.triggers.set(`${constructor.handle}.${key}`, {
			module: constructor,
			reason,
		})
	}

	output() {
		if (this.triggers.size === 0) {
			return false
		}

		return <Segment>
			<Message error icon="times circle outline">
				<Trans id="core.broken-log.broken-log.title" render={<Message.Header/>}>
					This log is broken.
				</Trans>
				<Trans id="core.broken-log.broken-log.description">
					One or more modules have reported that this log contains inconsistencies that would suggest data is missing or incorrect. While the system does try to maintain sane results in this situation, some statistics may be inaccurate.
				</Trans>
			</Message>

			<Table basic="very" compact="very">
				<Table.Header>
					<Table.Row>
						<Trans id="core.broken-log.list.module" render={<Table.HeaderCell/>}>Module</Trans>
						<Trans id="core.broken-log.list.reason" render={<Table.HeaderCell/>}>Reason</Trans>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{Array.from(this.triggers.values()).map(({module, reason}) => (
						<Table.Row>
							<Table.Cell><NormalisedMessage message={module.title} id={module.i18n_id}/></Table.Cell>
							<Table.Cell>{reason}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table>
		</Segment>
	}
}
