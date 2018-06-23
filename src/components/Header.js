import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
import { Container, Menu } from 'semantic-ui-react'

import { getPathMatch } from 'utilities'

class Header extends Component {
	static propTypes = {
		location: PropTypes.shape({
			pathname: PropTypes.string.isRequired
		}).isRequired,
		report: PropTypes.shape({
			loading: PropTypes.bool.isRequired,
			title: PropTypes.string,
			code: PropTypes.string
		})
	}

	render() {
		const {
			location: {pathname},
			report
		} = this.props

		// Need to do this janky shit to get the router path match
		const pathMatch = getPathMatch(pathname)

		// Grab the field we're interested in
		const pathParams = pathMatch? pathMatch.params : {}
		const code = pathParams.code
		const fightId = parseInt(pathParams.fight, 10)
		const combatantId = parseInt(pathParams.combatant, 10)

		const reportLoaded = report && !report.loading && report.code === code
		const crumbs = []

		// Report
		if (code) {
			let title = code
			if (reportLoaded) {
				title = report.title
			}
			crumbs.push({
				title,
				url: `/find/${code}/`
			})
		}

		// Fight
		if (fightId) {
			let title = fightId
			if (reportLoaded && fightId !== 'last') {
				const fight = report.fights.find(fight => fight.id === fightId)
				// Do I want the kill time too?
				title = fight? fight.name : fightId
			}
			crumbs.push({
				title,
				url: `/find/${code}/${fightId}/`
			})
		}

		// Combatant
		if (combatantId) {
			let title = combatantId
			if (reportLoaded) {
				const combatant = report.friendlies.find(friendly => friendly.id === combatantId)
				title = combatant? combatant.name : combatantId
			}
			crumbs.push({
				title,
				url: `/analyse/${code}/${fightId}/${combatantId}/`
			})
		}

		const onHome = pathname === '/'

		return <Menu fixed="top" inverted secondary={onHome} size={onHome? 'massive' : null}>
			<Container>
				<Menu.Item as={Link} to="/" header>
					<img src={process.env.PUBLIC_URL + '/logo.png'} style={{height: 20, width: 'auto', marginRight: '0.5em'}} alt="logo"/>
					xivanalysis
				</Menu.Item>
				{crumbs.map(crumb => <Menu.Item key={crumb.url} as={Link} to={crumb.url}>{crumb.title}</Menu.Item>)}

				<Menu.Menu position="right">
					<Menu.Item icon="discord" href="https://discord.gg/jVbVe44" target="_blank"/>
					<Menu.Item icon="github" href="https://github.com/xivanalysis/xivanalysis" target="_blank"/>
				</Menu.Menu>
			</Container>
		</Menu>
	}
}

const mapStateToProps = state => ({
	report: state.report
})

export default withRouter(connect(mapStateToProps)(Header))
