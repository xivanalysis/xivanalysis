import App from 'components/App'
import I18nLoader from 'components/I18nLoader'
import {Provider as TooltipProvider} from 'components/ui/DbLink'
import React from 'react'
import {BrowserRouter as Router} from 'react-router-dom'
import {StoreProvider} from 'store'

export default class Root extends React.Component {
	render() {
		return (
			<StoreProvider>
				<I18nLoader>
					<TooltipProvider>
						<Router>
							<App/>
						</Router>
					</TooltipProvider>
				</I18nLoader>
			</StoreProvider>
		)
	}
}
