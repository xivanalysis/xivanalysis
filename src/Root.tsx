import App from 'components/App'
import I18nLoader from 'components/I18nLoader'
import {Provider as TooltipProvider} from 'components/ui/DbLink'
import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {BrowserRouter as Router} from 'react-router-dom'
import store from 'store'
import {StoreProvider} from 'storenew'

export default class Root extends React.Component {
	render() {
		return (
			<ReduxProvider store={store}>
				<StoreProvider>
					<I18nLoader>
						<TooltipProvider>
							<Router>
								<App/>
							</Router>
						</TooltipProvider>
					</I18nLoader>
				</StoreProvider>
			</ReduxProvider>
		)
	}
}
