import classNames from 'classnames'
import {observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React, {useRef, useEffect, useContext} from 'react'
import ReactDOM from 'react-dom'
import {Icon, Popup} from 'semantic-ui-react'

import I18nMenu from 'components/ui/I18nMenu'
import {StoreContext} from 'store'
import ReportLink from './ReportLink'

import styles from './Options.module.css'

// Version info
const version = process.env.REACT_APP_VERSION || 'DEV'
const gitCommit = process.env.REACT_APP_GIT_COMMIT || 'DEV'
const gitBranch = process.env.REACT_APP_GIT_BRANCH || 'DEV'

export default function Options(props) {
	const {view = 'vertical'} = props

	const {sidebarStore} = useContext(StoreContext)

	const reportLinkRef = useRef()
	useEffect(
		() => {
			sidebarStore.setReportLinkRef(reportLinkRef)
			return () => sidebarStore.setReportLinkRef(undefined)
		},
		[sidebarStore],
	)

	return (
		<div className={view === 'horizontal' ? styles.horizontal : undefined}>
			<div className={styles.row}>
				<div ref={reportLinkRef}/>

				<ReportLink/>
			</div>

			<div className={styles.row}>
				<I18nMenu/>
			</div>

			<div className={classNames(styles.row, styles.meta)}>
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
	)
}

Options.propTypes = {
	view: PropTypes.oneOf([
		'vertial',
		'horizontal',
	]),
}

export const ReportLinkContent = observer(({children}) => {
	const {sidebarStore: {reportLinkRef}} = useContext(StoreContext)

	if (reportLinkRef?.current == null) {
		return null
	}

	return ReactDOM.createPortal(
		children,
		reportLinkRef.current,
	)
})
