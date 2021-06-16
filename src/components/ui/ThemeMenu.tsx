import {Theme, THEMEDEBUG, THEMES} from 'data/THEMES'
import React, {useContext} from 'react'
import {Dropdown, DropdownItemProps, Icon} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {ThemeContext} from 'theme/ThemeContext'
import styles from './I18nMenu.module.css'

const ThemeMenu = () => {
	const {theme, setTheme} = useContext(ThemeContext) ?? {}
	const {themeStore} = useContext(StoreContext)

	const availableThemes = Object.entries(THEMES)
		.filter(([themeOption, data]) => THEMEDEBUG || data.enable || theme === themeOption)
		.map(([themeOption, data]) => ({
			...data.menu,
			value: themeOption,
		}))

	const handleChangeTheme = (_event: React.MouseEvent, data: DropdownItemProps) => {
		if (setTheme == null) { return }
		if (data.value == null) { return }
		const newTheme = Theme[data.value as keyof typeof Theme]
		setTheme(newTheme)
		themeStore.setCurrentTheme(newTheme)
	}

	return (

		<div className={styles.container}>
			{/* Site language */}
			<Dropdown
				className={styles.dropdown}
				trigger={<>
					<Icon name="lightbulb"/>
					{theme ? THEMES[theme].menu.text : 'Theme'}
				</>}
			>
				<Dropdown.Menu>
					{availableThemes.map(option => <Dropdown.Item
						key={option.value}
						active={theme === option.value}
						onClick={handleChangeTheme}
						{...option}
						className={styles.menuItem}
					/>)}
				</Dropdown.Menu>
			</Dropdown>
		</div>
	)
}

export default ThemeMenu
