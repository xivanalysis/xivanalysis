import {computed} from 'mobx'
import {observer} from 'mobx-react'
import React, {Component} from 'react'
import {Icon} from 'semantic-ui-react'
import {StoreContext} from 'store'
import styles from './ThemeMenu.module.css'

const DEBUG = process.env.NODE_ENV === 'development'

@observer
class ThemeMenu extends Component {
	static contextType = StoreContext

	@computed
	get darkMode() {
		const {themeStore} = this.context
		return themeStore.darkMode
	}

	setAppBackgroundColor(themeStore) {
		document.querySelector(':root').style.setProperty('--backdrop', themeStore.darkMode ? '#3d3d3d': '#f5f8fa')
	}

	componentDidMount() {
		const {themeStore} = this.context
		this.setAppBackgroundColor(themeStore)
	}

	handleChange = () => {
		const {themeStore} = this.context
		themeStore.setDarkMode(!themeStore.darkMode)
		this.setAppBackgroundColor(themeStore)
	}

	render() {
		const {themeStore} = this.context
		const darkMode = themeStore.darkMode

		return <div className={styles.container}>
			<input id="darkModeToggle" type="checkbox" checked={darkMode} onChange={this.handleChange}/>
			<label htmlFor="darkModeToggle"><Icon name="moon" /></label>
		</div>
	}
}

export default ThemeMenu
