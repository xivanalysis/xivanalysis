import classNames from 'classnames'
import {I18nMenu} from 'components/ui/I18nMenu'
import {observer} from 'mobx-react'
import {useRef, useEffect, useContext, ReactNode} from 'react'
import ReactDOM from 'react-dom'
import {StoreContext} from 'store'
import {LinkDiscord, LinkGitHub} from './Links'
import styles from './Options.module.css'
import {VersionInfo} from './Version'

export function Options() {
	const {sidebarStore} = useContext(StoreContext)

	const reportLinkRef = useRef<HTMLDivElement>(null)

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
		</div>

		<div className={styles.row}>
			<I18nMenu/>
		</div>

		<div className={classNames(styles.row, styles.meta)}>
			<LinkDiscord/>
			<LinkGitHub/>
			<VersionInfo/>
		</div>
	</>
}

export type ReportLinkContentProps = {
	children?: ReactNode
}

export const ReportLinkContent = observer(({children}: ReportLinkContentProps) => {
	const {sidebarStore: {reportLinkRef}} = useContext(StoreContext)

	if (reportLinkRef?.current == null) {
		return null
	}

	return ReactDOM.createPortal(
		children,
		reportLinkRef.current,
	)
})
