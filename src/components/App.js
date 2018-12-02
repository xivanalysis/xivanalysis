import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Route, Switch, withRouter} from 'react-router-dom'
import {Icon} from  'semantic-ui-react'

import store from 'store'
import {clearGlobalError} from 'store/actions'
import Analyse from './Analyse'
import ErrorBoundary from './ErrorBoundary'
import Find from './Find'
import GlobalSidebar from './GlobalSidebar'
import Home from './Home'
import LastFightRedirect from './LastFightRedirect'

import 'semantic-ui-css/semantic.min.css'
import '@xivanalysis/tooltips/dist/index.es.css'
import './App.css'
import styles from './App.module.css'

@withRouter
class App extends Component {
	static propTypes = {
		history: PropTypes.shape({
			location: PropTypes.object.isRequired,
			listen: PropTypes.func.isRequired,
		}).isRequired,
	}

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

	_locationDidChange(/* location */) {
		// User's browsed - clear the global error state. Page can always re-throw one.
		store.dispatch(clearGlobalError())
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
			<div className={styles.mobileHeader}>
				<Icon
					name="bars"
					className={styles.hamburger}
					onClick={this._toggleSidebar}
				/>
				<img
					src={process.env.PUBLIC_URL + '/logo.png'}
					alt="logo"
					className={styles.logo}
				/>
				xivanalysis
			</div>

			<div className={styles.container}>
				<div className={classnames(
					styles.sidebar,
					onHome && styles.home,
					sidebarOpen && styles.open,
				)}>
					<div className={styles.sidebarWrapper}>
						<GlobalSidebar centerLogo={onHome}/>
					</div>
				</div>

				<div className={styles.content}>
					<ErrorBoundary>
						<Switch>
							<Route exact path="/" component={Home}/>
							<Route path="/:section/:code/last/:combatant?" component={LastFightRedirect}/>
							<Route path="/find/:code/:fight?" component={Find}/>
							<Route path="/analyse/:code/:fight/:combatant" component={Analyse}/>
						</Switch>
					</ErrorBoundary>
				</div>
			</div>
		</>
	}
}

export default App
