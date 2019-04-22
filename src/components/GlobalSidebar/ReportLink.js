import {Trans} from '@lingui/react'
import PropTypes from 'prop-types'
import React from 'react'
import {withRouter} from 'react-router'
import {getPathMatch} from 'utilities'

import styles from './ReportLink.module.css'
import fflogsLogo from './fflogs.png'

class ReportLink extends React.Component {
	static propTypes = {
		location: PropTypes.shape({
			pathname: PropTypes.string.isRequired,
		}).isRequired,
	}

	getReportUrl() {
		const {location: {pathname}} = this.props
		const pathMatch = getPathMatch(pathname)
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
			url += '#' + params.join('&')
		}

		return url
	}

	render() {
		const url = this.getReportUrl()

		if (!url) {
			return null
		}

		return (
			<a
				href={this.getReportUrl()}
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
}

export default withRouter(ReportLink)
