import {i18nMark} from '@lingui/react'
import React, {Fragment} from 'react'
import {Header, Segment} from 'semantic-ui-react'

import ContributorLabel from 'components/ui/ContributorLabel'
import Module, {DISPLAY_ORDER} from 'parser/core/Module'

import styles from './ChangeLog.module.css'

// TODO: Make it work with Core changelog.
let _changeLog = []

export default class ChangeLog extends Module {

	static handle = 'changelog'
	static displayOrder = DISPLAY_ORDER.BOTTOM

	static title = 'Changelog'
	static i18n_id = i18nMark('core.changelog.title')

	constructor(...args) {
		super(...args)

		_changeLog = [...this.parser.meta.changelog]
	}

	output() {
		if (_changeLog.length === 0) {
			return false
		}

		return <div>
			{_changeLog.map((item, key) => {
				// Fixes the issue with the 'attach' property. Basically, if it's the first one it's just gonna attach to the top, if not, it'll attach to the segment/header above it.
				const attach = (key === 0) ? 'top' : true

				return <Fragment key={key}>
					<Header as="h5" attached={attach}>
						{item.date.toLocaleDateString()}
						<span className={styles.contributor}>{item.contributors.map(contributor => {
							return <div key={typeof contributor === 'string' ? contributor : contributor.name}>
								<ContributorLabel contributor={contributor} />
							</div>
						})}</span>
					</Header>
					<Segment attached className={styles.changes}>
						{item.changes}
					</Segment>
				</Fragment>
			})}
		</div>
	}
}
