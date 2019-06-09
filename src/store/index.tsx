import {configure} from 'mobx'
import React from 'react'
import {globalErrorStore} from './globalError'
import {i18nStore} from './i18n'
import {reportStore} from './report'
import {settingsStore} from './settings'
import {configureStorage} from './storage'

configure({
	enforceActions: 'observed',
})

export const stores = {
	reportStore,
	globalErrorStore,
	i18nStore,
	settingsStore,
}

configureStorage({
	i18nStore,
	settingsStore,
})

export const StoreContext = React.createContext(stores)

export const StoreProvider: React.FunctionComponent = ({children}) => (
	<StoreContext.Provider value={stores}>
		{children}
	</StoreContext.Provider>
)
