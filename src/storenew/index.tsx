import {configure} from 'mobx'
import {Provider} from 'mobx-react'
import React from 'react'
import {ReportStore} from './report'

configure({
	enforceActions: 'observed',
})

export const stores = {
	reportStore: new ReportStore(),
}

export const StoreProvider: React.FunctionComponent = ({children}) => (
	<Provider {...stores}>
		{children}
	</Provider>
)
