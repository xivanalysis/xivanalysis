import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'

import App from 'components/App'
import configureStore from 'store'

const store = configureStore()

class Root extends Component {
	render() {
		return (
			<Provider store={store}>
				<Router>
					<App/>
				</Router>
			</Provider>
		)
	}
}

export default Root
