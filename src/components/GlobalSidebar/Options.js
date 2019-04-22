import PropTypes from 'prop-types'
import React from 'react'
import {Icon, Popup} from 'semantic-ui-react'

import I18nMenu from 'components/ui/I18nMenu'
import ReportLink from './ReportLink'

import styles from './Options.module.css'

// Version info
const version = process.env.REACT_APP_VERSION || 'DEV'
const gitCommit = process.env.REACT_APP_GIT_COMMIT || 'DEV'
const gitBranch = process.env.REACT_APP_GIT_BRANCH || 'DEV'

export default class Options extends React.Component {
	static propTypes = {
		view: PropTypes.oneOf([
			'vertial',
			'horizontal',
		]),
	}

	render() {
		const {view = 'vertical'} = this.props

		return <div className={view === 'horizontal' ? styles.horizontal : undefined}>
			<div className={styles.row}>
				<ReportLink/>
			</div>

			<div className={styles.row}>
				<I18nMenu/>
			</div>

			<div className={styles.row}>
				<a
					href="https://discord.gg/jVbVe44"
					target="_blank"
					rel="noopener noreferrer"
					className={styles.icon}
				>
					<Icon name="discord"/>
				</a>
				<a
					href="https://github.com/xivanalysis/xivanalysis"
					target="_blank"
					rel="noopener noreferrer"
					className={styles.icon}
				>
					<Icon name="github"/>
				</a>

				<Popup
					trigger={<span className={styles.version}>{'#' + version}</span>}
					position="bottom center"
				>
					<Popup.Content>
						<dl className={styles.versionInfo}>
							<dt>Commit</dt>
							<dd>{gitCommit}</dd>
							<dt>Branch</dt>
							<dd>{gitBranch}</dd>
						</dl>
					</Popup.Content>
				</Popup>
			</div>
		</div>
	}
}
