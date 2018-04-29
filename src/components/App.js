import React, { Component, Fragment } from 'react'
import { Switch, Route } from 'react-router-dom'

import Header from './Header'
import Home from 'components/routes/Home'
import Find from 'components/routes/Find'
import Analyse from 'components/routes/Analyse'

import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

class App extends Component {
	render() {
		return <Fragment>
			<Header/>

			<div className="alert alert-danger">
				<div className="container">
					<strong>Please do not share links to this site.</strong><br/>
					I&apos;m really excited at the possibilities of this system, and I hope you are too. But right now, there&apos;s a <em>lot</em> of work to be done before this can be considered stable, and the advice/info it gives can be considered accurate.<br/>
					If you come across a massive issue, drop me a DM (ackwell#3835).
				</div>
			</div>

			<Switch>
				<Route exact path="/" component={Home}/>
				<Route path="/find/:code/:fight?" component={Find}/>
				<Route path="/analyse/:code/:fight/:combatant" component={Analyse}/>
			</Switch>
		</Fragment>
	}
}

export default App
