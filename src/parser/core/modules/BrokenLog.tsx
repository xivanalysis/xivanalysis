import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import * as Sentry from '@sentry/browser'
import {Message, Segment} from 'akkd'
import {NormalisedMessage} from 'components/ui/NormalisedMessage'
import {getReportPatch} from 'data/PATCHES'
import {ReactNode} from 'react'
import {Table} from 'semantic-ui-react'
import {Analyser, DisplayMode} from '../Analyser'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'

interface Trigger {
	source: typeof Analyser
	reason?: ReactNode
}

export class BrokenLog extends Analyser {
	static override handle = 'brokenLog'
	static override title = msg({id: 'core.broken-log.title', message: 'Broken Log'})
	static override displayOrder = DISPLAY_ORDER.BROKEN_LOG
	static override displayMode = DisplayMode.RAW

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
		reason?: ReactNode,
		erroneous = true,
	) {
		const constructor = (source.constructor as typeof Analyser)
		const {handle} = constructor
		const triggerKey = `${handle}.${key}`

		// If this is the first time this issue has been triggered, try and report it to Sentry
		if (
			erroneous &&
			!this.triggers.has(triggerKey) &&
			!getReportPatch(this.parser.report).branch
		) {
			const job = this.parser.actor.job

			Sentry.withScope(scope => {
				scope.setTags({
					job,
					module: handle,
				})
				scope.setExtras({
					source: this.parser.report.meta.source,
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

	override output() {
		if (this.triggers.size === 0) {
			return false
		}

		return <Segment>
			<Message error icon="times circle outline">
				<Message.Header>
					<Trans id="core.broken-log.broken-log.title">
						This log is broken.
					</Trans>
				</Message.Header>
				<Trans id="core.broken-log.broken-log.description">
					One or more modules have reported that this log contains inconsistencies that would suggest data is missing or incorrect. While the system does try to maintain sane results in this situation, some statistics may be inaccurate.
				</Trans>
			</Message>

			<Table basic="very" compact="very">
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell><Trans id="core.broken-log.list.module">Module</Trans></Table.HeaderCell>
						<Table.HeaderCell><Trans id="core.broken-log.list.reason">Reason</Trans></Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{Array.from(this.triggers.values()).map(({source, reason}, index) => (
						<Table.Row key={index}>
							<Table.Cell>{source.title != null ? <NormalisedMessage message={source.title}/> : source.handle}</Table.Cell>
							<Table.Cell>{reason}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
			</Table>
		</Segment>
	}
}
