import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import * as Sentry from '@sentry/browser'
import {Message, Segment} from 'akkd'
import NormalisedMessage from 'components/ui/NormalisedMessage'
import {getReportPatch} from 'data/PATCHES'
import React from 'react'
import {Table} from 'semantic-ui-react'
import {Analyser, DisplayMode} from '../Analyser'
import {dependency} from '../Injectable'
import {Data} from './Data'
import DISPLAY_ORDER from './DISPLAY_ORDER'

interface Trigger {
	source: typeof Analyser
	reason?: React.ReactNode
}

export default class BrokenLog extends Analyser {
	static override handle = 'brokenLog'
	static override title = t('core.broken-log.title')`Broken Log`
	static override displayOrder = DISPLAY_ORDER.BROKEN_LOG
	static override displayMode = DisplayMode.RAW

	@dependency private data!: Data

	private triggers = new Map<string, Trigger>()

	/**
	 * Trigger the module to display the broken log error.
	 * @param key Unique key that represents the BL trigger
	 * @param source Module that is triggering BL
	 * @param reason Short description of why BL was triggered
	 * @param erroneous If this trigger should be reported as an error to logs.
	 */
	trigger(
		source: Analyser,
		key: string,
		reason?: React.ReactNode,
		erroneous = true,
	) {
		const constructor = (source.constructor as typeof Analyser)
		const {handle} = constructor
		const triggerKey = `${handle}.${key}`

		// If this is the first time this issue has been triggered, try and report it to Sentry
		if (
			erroneous &&
			!this.triggers.has(triggerKey) &&
			!getReportPatch(this.parser.newReport).branch
		) {
			const job = this.parser.actor.job

			Sentry.withScope(scope => {
				scope.setTags({
					job,
					module: handle,
				})
				scope.setExtras({
					source: this.parser.newReport.meta.source,
					pull: this.parser.pull.id,
					actor: this.parser.actor.id,
				})
				Sentry.captureMessage(`${job}.${triggerKey}`)
			})
		}

		this.triggers.set(triggerKey, {
			source: constructor,
			reason,
		})
	}

	override initialise() {
		const unknownAction = this.data.actions.UNKNOWN.id
		this.addEventHook({cause: {type: 'action', action: unknownAction}}, this.triggerUnknownCause)
		this.addEventHook({action: unknownAction}, this.triggerUnknownCause)

		const unknownStatus = this.data.statuses.UNKNOWN.id
		this.addEventHook({cause: {type: 'status', status: unknownStatus}}, this.triggerUnknownCause)
		this.addEventHook({status: unknownStatus}, this.triggerUnknownCause)
	}

	private triggerUnknownCause() {
		this.trigger(this, 'unknown action', (
			<Trans id="core.broken-log.trigger.unknown-action">
				One or more actions were recorded incorrectly, and could not be parsed.
			</Trans>
		))
	}

	override output() {
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
					{Array.from(this.triggers.values()).map(({source, reason}, index) => (
						<Table.Row key={index}>
							<Table.Cell><NormalisedMessage message={source.title}/></Table.Cell>
							<Table.Cell>{reason}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table>
		</Segment>
	}
}
