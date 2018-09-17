import {Trans, i18nMark} from '@lingui/react'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

import Module from 'parser/core/Module'
import DISPLAY_ORDER from './DISPLAY_ORDER'

export default class BrokenLog extends Module {
	static handle = 'brokenLog'
	static title = 'Broken Log'
	static i18n_id = i18nMark('core.broken-log.title')
	static displayOrder = DISPLAY_ORDER.BROKEN_LOG

	_triggered = false

	/**
	 * Trigger the module to display the broken log error. Subsequent calls will
	 * noop.
	 */
	trigger() {
		this._triggered = true
	}

	output() {
		if (!this._triggered) {
			return false
		}

		return <Message error icon>
			<Icon name="times circle outline"/>
			<Message.Content>
				<Trans id="core.broken-log.broken-log.title" render={<Message.Header/>}>
					This log is broken.
				</Trans>
				<Trans id="core.broken-log.broken-log.description">
					One or more modules have reported that this log contains inconsistencies that would suggest data is missing or incorrect. While the system does try to maintain sane results in this situation, some statistics may be inaccurate.
				</Trans>
			</Message.Content>
		</Message>
	}
}
