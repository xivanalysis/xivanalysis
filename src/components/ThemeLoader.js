import {observer} from 'mobx-react'
import * as PropTypes from 'prop-types'
import React from 'react'
import {StoreContext} from 'store'
import styles from 'theme.module.css'

@observer
class ThemeLoader extends React.Component {
	static propTypes = {
		id: PropTypes.string,
		children: PropTypes.node,
	}

	static contextType = StoreContext

	render () {
		return (
			<div className={this.context.themeStore.darkMode ? styles.darkMode : ''}>
				{this.props.children}
			</div>
		)
	}
}

export default ThemeLoader
