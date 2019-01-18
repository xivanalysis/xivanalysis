import {configure} from 'mobx'
import {Provider} from 'mobx-react'
import React from 'react'
import {globalErrorStore} from './globalError'
import {reportStore} from './report'

configure({
	enforceActions: 'observed',
})

export const stores = {
	reportStore,
	globalErrorStore,
}

export const StoreProvider: React.FunctionComponent = ({children}) => (
	<Provider {...stores}>
		{children}
	</Provider>
)
