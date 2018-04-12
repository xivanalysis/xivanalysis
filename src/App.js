import React, { Component, Fragment } from 'react'
import {
	HashRouter as Router,
	Route,
	Link
} from 'react-router-dom'
import Home from './routes/Home'

import './App.css'

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

					<div className="container">
						<Route exact path="/" component={Home}/>
					</div>
				</Fragment>
			</Router>
		)
	}
}

export default App
