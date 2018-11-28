import React from 'react'
import {Link} from 'react-router-dom'
import {Icon, Popup} from 'semantic-ui-react'

import I18nMenu from 'components/ui/I18nMenu'

import Breadcrumbs from './Breadcrumbs'
import styles from './GlobalSidebar.module.css'

class GlobalSidebar extends React.PureComponent {
	render() {
		// Version info
		const version = process.env.REACT_APP_VERSION || 'DEV'
		const gitCommit = process.env.REACT_APP_GIT_COMMIT || 'DEV'
		const gitBranch = process.env.REACT_APP_GIT_BRANCH || 'DEV'

		return <>
			<div className={styles.sidebar}>
				{/* Main logo */}
				<Link to="/" className={styles.logo}>
					<img
						src={process.env.PUBLIC_URL + '/logo.png'}
						alt="logo"
						className={styles.logoImage}
					/>
					xivanalysis
				</Link>

				<Breadcrumbs/>

				{/* Options pinned to the bottom */}
				<div className={styles.options}>
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

					<I18nMenu />

					<a
						href="https://discord.gg/jVbVe44"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Icon name="discord"/>
					</a>
					<a
						href="https://github.com/xivanalysis/xivanalysis"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Icon name="github"/>
					</a>
				</div>
			</div>
		</>
	}
}

export default GlobalSidebar
