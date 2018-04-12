import React, { Component } from 'react'
import './App.css'
import {
	HashRouter as Router,
	Route
} from 'react-router-dom'

import Home from './routes/Home'

class App extends Component {
	render() {
		return (
			<Router>
				<div>
					{/* TODO: nav bar */}

					<Route exact path="/" component={Home}/>
				</div>
			</Router>
		)
	}
}

export default App
