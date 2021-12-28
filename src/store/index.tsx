import {configure} from 'mobx'
import React, {ReactNode} from 'react'
import {globalErrorStore} from './globalError'
import {i18nStore} from './i18n'
import {settingsStore} from './settings'
import {sidebarStore} from './sidebar'
import {configureStorage} from './storage'

configure({
	enforceActions: 'observed',
})

export const stores = {
	globalErrorStore,
	i18nStore,
	settingsStore,
	sidebarStore,
}

configureStorage({
	i18nStore,
	settingsStore,
})

export const StoreContext = React.createContext(stores)

export const StoreProvider = ({children}: {children: ReactNode}) => (
	<StoreContext.Provider value={stores}>
		{children}
	</StoreContext.Provider>
)
