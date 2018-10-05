import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {BrowserRouter as Router} from 'react-router-dom'

import App from 'components/App'
import I18nLoader from 'components/I18nLoader'
import {Provider as TooltipProvider} from 'components/ui/DbLink'
import store from 'store'

export default class Root extends React.Component {
	render() {
		return (
			<ReduxProvider store={store}>
				<I18nLoader>
					<TooltipProvider>
						<Router>
							<App/>
						</Router>
					</TooltipProvider>
				</I18nLoader>
			</ReduxProvider>
		)
	}
}
