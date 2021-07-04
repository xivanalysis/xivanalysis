import {Theme, THEMES} from 'data/THEMES'
import React, {createContext, ReactNode, useContext, useState} from 'react'
import {StoreContext} from 'store'

interface ThemeContextValue {
	theme: Theme,
	setTheme: React.Dispatch<React.SetStateAction<Theme>>
}
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeContextProvider({children}: {children: ReactNode}) {
	const {themeStore} = useContext(StoreContext)

	const [theme, setTheme] = useState(themeStore.currentTheme)

	return (
		<ThemeContext.Provider value={{theme, setTheme}}>
			<div className={THEMES[theme].className}>
				{children}
			</div>
		</ThemeContext.Provider>
	)
}
