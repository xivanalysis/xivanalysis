import React, { Component, Fragment } from 'react'
import { Switch, Route } from 'react-router-dom'
import { Container, Message } from 'semantic-ui-react'

import Analyse from './Analyse'
import ErrorBoundry from './ErrorBoundry'
import Find from './Find'
import Header from './Header'
import Home from './Home'
import LastFightRedirect from './LastFightRedirect'

// import 'bootstrap/dist/css/bootstrap.min.css'
import 'semantic-ui-css/semantic.min.css'
import './App.css'

class App extends Component {
	render() {
		return <Fragment>
			<Header/>

			<Message error>
				<Container>
					<Message.Header>Please do not share links to this site.</Message.Header>
					<p>I&apos;m really excited at the possibilities of this system, and I hope you are too. But right now, there&apos;s a <em>lot</em> of work to be done before this can be considered stable, and the advice/info it gives can be considered accurate.<br/>
					If you come across a massive issue, drop a message in our discord channel.</p>
				</Container>
			</Message>

			<ErrorBoundry>
				<Switch>
					<Route exact path="/" component={Home}/>
					<Route path="/:section/:code/last/:combatant?" component={LastFightRedirect}/>
					<Route path="/find/:code/:fight?" component={Find}/>
					<Route path="/analyse/:code/:fight/:combatant" component={Analyse}/>
				</Switch>
			</ErrorBoundry>
		</Fragment>
	}
}

export default App
