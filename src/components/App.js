import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Switch, Route} from 'react-router-dom'
import {Container, Message} from 'semantic-ui-react'

import store from 'store'
import {clearGlobalError} from 'store/actions'
import Analyse from './Analyse'
import ErrorBoundry from './ErrorBoundry'
import Find from './Find'
import Header from './Header'
import Home from './Home'
import LastFightRedirect from './LastFightRedirect'

import 'semantic-ui-css/semantic.min.css'
import './App.css'

class App extends Component {
	static contextTypes = {
		router: PropTypes.shape({
			history: PropTypes.shape({
				location: PropTypes.object.isRequired,
				listen: PropTypes.func.isRequired,
			}).isRequired,
		}).isRequired,
	}

	_unlisten = null

	componentDidMount() {
		// Set up a history listener
		const history = this.context.router.history
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
		return <Fragment>
			<Header/>

			<Container>
				{/* <Message error>
					<p><strong>We're under heavy load!</strong></p>
					<p>
						Due to an unexpected &amp; severe increase in traffic to our site, you may run into FFLogs API Errors. Please bear with us while we resolve the issue.<br/>
						突然サイトのトラフィックが増えたので、FFLogsからデータ制限可能性があります。<br/>
						Thank you for your patience and understanding.<br />
						ご理解してくれてありがとうございます。<br/>
					</p>
					<p><em>xivanalysis Development Team</em></p>
				</Message> */}
				<Message info>
					<p><strong>このサイトの使用注意点</strong></p>
					<p>現時点でこのアナリシストは不完全であり、召喚のみに適用されています(召喚でもまだ最適化中です）。全ジョブサポートは現在作業中です。そのため、対応されていないジョブにアナリシストを行うと分析の錯誤が出る恐れがあります。サポートやお問い合わせは<a href="https://discord.gg/jVbVe44">Discord</a> でお願いします。</p>
				</Message>
			</Container>

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
