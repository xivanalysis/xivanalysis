import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Link, Route, Switch, withRouter} from 'react-router-dom'
import {Icon} from 'semantic-ui-react'

import {Container} from 'akkd'
import Analyse from './Analyse'
import {BranchBanner} from './BranchBanner'
import CombatantLookupRedirect from './CombatantLookupRedirect'
import ErrorBoundary from './ErrorBoundary'
import Find from './Find'
import GlobalSidebar from './GlobalSidebar'
import Home from './Home'
import LastFightRedirect from './LastFightRedirect'

import 'semantic-ui-css/semantic.min.css'
import '@xivanalysis/tooltips/dist/index.es.css'
import './App.css'
import styles from './App.module.css'
import {StoreContext} from 'store'

class App extends Component {
	static propTypes = {
		history: PropTypes.shape({
			location: PropTypes.object.isRequired,
			listen: PropTypes.func.isRequired,
		}).isRequired,
	}

	static contextType = StoreContext

	_unlisten = null

	state = {
		sidebarOpen: false,
	}

	componentDidMount() {
		// Set up a history listener
		const {history} = this.props
		this._locationDidChange(history.location)
		this._unlisten = history.listen(this._locationDidChange)
	}

	componentWillUnmount() {
		// Destroy the listener as we shut down
		this._unlisten()
	}

	_locationDidChange = (/* location */) => {
		// User's browsed - clear the global error state. Page can always re-throw one.
		const {globalErrorStore} = this.context
		globalErrorStore.clearGlobalError()
	}

	_toggleSidebar = () => {
		console.log('a')
		this.setState(state => ({sidebarOpen: !state.sidebarOpen}))
	}

	render() {
		const {history: {location: {pathname}}} = this.props
		const {sidebarOpen} = this.state

		const onHome = pathname === '/'

		return <>
			<div className={classnames(
				styles.mobileHeader,
				onHome && styles.home,
			)}>
				<Icon
					name="bars"
					className={styles.hamburger}
					onClick={this._toggleSidebar}
				/>
				<Link to="/" className={styles.logo}>
					<img
						src={process.env.PUBLIC_URL + '/logo.png'}
						alt="logo"
						className={styles.logoImage}
					/>
					xivanalysis
				</Link>
			</div>

			<div className={classnames(
				styles.container,
				onHome && styles.home,
			)}>
				<div className={classnames(
					styles.sidebar,
					sidebarOpen && styles.open,
				)}>
					<div className={styles.sidebarWrapper}>
						<GlobalSidebar centerLogo={onHome}/>
					</div>

					<div
						className={styles.sidebarBackdrop}
						onClick={this._toggleSidebar}
					/>
				</div>

				<Container className={styles.content}>
					<BranchBanner/>

					<ErrorBoundary>
						<Switch>
							<Route exact path="/" component={Home}/>
							<Route path="/:section/:code/last/:combatant*" component={LastFightRedirect}/>
							<Route path="/lookup/:code/:fight/:job/:name" component={CombatantLookupRedirect}/>
							<Route path="/find/:code/:fight?" component={Find}/>
							<Route path="/analyse/:code/:fight/:combatant" component={Analyse}/>
						</Switch>
					</ErrorBoundary>
				</Container>
			</div>
		</>
	}
}

export default withRouter(App)
