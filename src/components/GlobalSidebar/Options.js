import classNames from 'classnames'
import I18nMenu from 'components/ui/I18nMenu'
import ThemeMenu from 'components/ui/ThemeMenu'
import {observer} from 'mobx-react'
import React, {useRef, useEffect, useContext} from 'react'
import ReactDOM from 'react-dom'
import {StoreContext} from 'store'
import {LinkDiscord, LinkGitHub} from './Links'
import styles from './Options.module.css'
import ReportLink from './ReportLink'
import {VersionInfo} from './Version'

export default function Options() {
	const {sidebarStore} = useContext(StoreContext)

	const reportLinkRef = useRef()
	useEffect(
		() => {
			sidebarStore.setReportLinkRef(reportLinkRef)
			return () => sidebarStore.setReportLinkRef(undefined)
		},
		[sidebarStore],
	)

	return <>
		<div className={styles.row}>
			<div ref={reportLinkRef}/>

			<ReportLink/>
		</div>

		<div className={styles.row}>
			<I18nMenu/>
		</div>

		<div className={styles.row}>
			<ThemeMenu/>
		</div>

		<div className={classNames(styles.row, styles.meta)}>
			<LinkDiscord/>
			<LinkGitHub/>
			<VersionInfo/>
		</div>
	</>
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
