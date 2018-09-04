import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Switch, Route, withRouter} from 'react-router-dom'

import store from 'store'
import {clearGlobalError} from 'store/actions'
import Analyse from './Analyse'
import ErrorBoundary from './ErrorBoundary'
import Find from './Find'
import Header from './Header'
import Home from './Home'
import LastFightRedirect from './LastFightRedirect'

import 'semantic-ui-css/semantic.min.css'
import './App.css'

class App extends Component {
	static propTypes = {
		history: PropTypes.shape({
			location: PropTypes.object.isRequired,
			listen: PropTypes.func.isRequired,
		}).isRequired,
	}

	_unlisten = null

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

	render() {
		return <>
			<Header/>

			<ErrorBoundary>
				<Switch>
					<Route exact path="/" component={Home}/>
					<Route path="/:section/:code/last/:combatant?" component={LastFightRedirect}/>
					<Route path="/find/:code/:fight?" component={Find}/>
					<Route path="/analyse/:code/:fight/:combatant" component={Analyse}/>
				</Switch>
			</ErrorBoundary>
		</>
	}
}

export default withRouter(App)
