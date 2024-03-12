import App from 'components/App'
import {BreadcrumbProvider} from 'components/GlobalSidebar'
import I18nLoader from 'components/I18nLoader'
import ThemeLoader from 'components/ThemeLoader'
import {Provider as TooltipProvider} from 'components/ui/DbLink'
import React from 'react'
import {BrowserRouter as Router} from 'react-router-dom'
import {StoreProvider} from 'store'

export default () => (
	<StoreProvider>
		<I18nLoader>
			<ThemeLoader>
				<TooltipProvider>
					<Router>
						<BreadcrumbProvider>
							<App/>
						</BreadcrumbProvider>
					</Router>
				</TooltipProvider>
			</ThemeLoader>
		</I18nLoader>
	</StoreProvider>
)
