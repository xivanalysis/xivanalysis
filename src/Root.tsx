import App from 'components/App'
import {BreadcrumbProvider} from 'components/GlobalSidebar'
import I18nLoader from 'components/I18nLoader'
import {Provider as TooltipProvider} from 'components/ui/DbLink'
import React from 'react'
import {BrowserRouter as Router} from 'react-router-dom'
import {StoreProvider} from 'store'

export default () => (
	<StoreProvider>
		<I18nLoader>
			<TooltipProvider>
				<Router>
					<BreadcrumbProvider>
						<App/>
					</BreadcrumbProvider>
				</Router>
			</TooltipProvider>
		</I18nLoader>
	</StoreProvider>
)
