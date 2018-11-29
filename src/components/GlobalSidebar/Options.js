import React from 'react'
import {Icon, Popup} from 'semantic-ui-react'

import I18nMenu from 'components/ui/I18nMenu'

import styles from './Options.module.css'

// Version info
const version = process.env.REACT_APP_VERSION || 'DEV'
const gitCommit = process.env.REACT_APP_GIT_COMMIT || 'DEV'
const gitBranch = process.env.REACT_APP_GIT_BRANCH || 'DEV'

export default class Options extends React.PureComponent {
	render() {
		return <>
			<I18nMenu />

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

			<a
				href="https://discord.gg/jVbVe44"
				target="_blank"
				rel="noopener noreferrer"
			>
				<Icon name="discord" />
			</a>
			<a
				href="https://github.com/xivanalysis/xivanalysis"
				target="_blank"
				rel="noopener noreferrer"
			>
				<Icon name="github" />
			</a>
		</>
	}
}
