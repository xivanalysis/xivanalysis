import {i18nMark} from '@lingui/react'
import React from 'react'
import {Segment, Popup} from 'semantic-ui-react'

import Module, {DISPLAY_ORDER} from 'parser/core/Module'
import ContributorLabel from 'components/ui/ContributorLabel'

import styles from './ChangeLog.module.css'

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

		return <div>
			{changelog.map((item, index) => {
				// Fixes the issue with the 'attach' property. Basically, if it's the first one it's just gonna attach to the top, if not, it'll attach to the segment/header above it.
				let attach = {
					0: 'top',
					[changelog.length - 1]: 'bottom',
				}[index] || true
				if (changelog.length === 1) {
					attach = false
				}

				const dateString = item.date.toLocaleDateString()

				const change = <Segment attached={attach} className={styles.change}>
					<strong className={styles.date}>{dateString}</strong>
					<span className={styles.message}>{item.changes}</span>
					<div className={styles.contributors}>
						{item.contributors.map(contributor => <ContributorLabel key={contributor.name} contributor={contributor} />)}
					</div>
				</Segment>

				// Popup in case someone made the commit message too wide
				return <Popup
					key={index}
					trigger={change}
					header={dateString}
					content={item.changes}
					position="top center"
				/>
			})}
		</div>
	}
}
