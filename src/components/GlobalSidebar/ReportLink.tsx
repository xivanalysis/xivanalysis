import {Trans} from '@lingui/react'
import {useLocation} from 'react-router-dom'
import {getPathMatch} from 'utilities'
import fflogsLogo from './fflogs.png'
import styles from './ReportLink.module.css'

export function ReportLink() {
	const url = useReportUrl()

	if (!url) {
		return null
	}

	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className={styles.reportLink}
		>
			<img src={fflogsLogo} alt="FF Logs logo" className={styles.menuLogo}/>
			<Trans id="core.analyse.view-on-fflogs">
				View report on FF Logs
			</Trans>
		</a>
	)
}

type ReportParams = {
	code?: string
	fight?: string
	combatant?: string
}

function useReportUrl() {
	const {pathname} = useLocation()

	const pathMatch = getPathMatch<ReportParams>(pathname)
	const {code, fight, combatant} = pathMatch ? pathMatch.params : {}

	if (!code) {
		return
	}

	let url = `https://www.fflogs.com/reports/${code}`

	const params = [
		fight && `fight=${fight}`,
		combatant && `source=${combatant}`,
	].filter(Boolean)

	if (params.length > 0) {
		url += '?' + params.join('&')
	}

	return url
}
