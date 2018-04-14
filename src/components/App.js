import React, { Component, Fragment } from 'react'
import {
	HashRouter as Router,
	Switch,
	Route,
	Link
} from 'react-router-dom'

import Home from '@/components/routes/Home'
import Find from '@/components/routes/Find'

import 'bootstrap/dist/css/bootstrap.min.css'

class App extends Component {
	render() {
		return (
			<Router>
				<Fragment>
					<nav className="navbar navbar-dark bg-dark">
						<div className="container">
							<Link to="/" className="navbar-brand">xivanalysis</Link>
						</div>
					</nav>

					<Switch>
						<Route exact path="/" component={Home}/>
						<Route path="/find/:code/:fight?" component={Find}/>
					</Switch>
				</Fragment>
			</Router>
		)
	}
}

export default App
