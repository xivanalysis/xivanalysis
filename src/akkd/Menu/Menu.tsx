import React from 'react'
import styles from './Menu.module.css'
import {MenuItem} from './MenuItem'

export class Menu extends React.PureComponent {
	static Item = MenuItem

	render() {
		const {children} = this.props
		return <div className={styles.menu}>
			{children}
		</div>
	}
}
