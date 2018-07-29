import React, {Component} from 'react'
import {Provider} from 'react-redux'
import {BrowserRouter as Router} from 'react-router-dom'

import App from 'components/App'
import I18nLoader from 'components/I18nLoader'
import store from 'store'

class Root extends Component {
	render() {
		return (
			<Provider store={store}>
				<I18nLoader>
					<Router>
						<App/>
					</Router>
				</I18nLoader>
			</Provider>
		)
	}
}

export default Root
