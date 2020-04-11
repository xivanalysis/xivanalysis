import classNames from 'classnames'
import React from 'react'
import {Icon} from 'semantic-ui-react'
import styles from './Button.module.css'

interface Props {
	icon?: any,
	content?: any,
	nowrap?: boolean,
	onClick: ()=>void,
	pill?: boolean,
}

export class Button extends React.PureComponent<Props> {
	render() {
		const {
			icon,
			content,
			nowrap,
			onClick,
			pill,
			children,
		} = this.props

		return (
			<button
				className={classNames(
					icon && !(content || children) && styles.icon,
					nowrap && styles.nowrap,
					pill && styles.pill,
					styles.button,
				)}
				onClick={onClick}
			>
				{icon && <Icon fitted={!(content || children) ? true : false} name={icon}/>}
				{content ? content : children}
			</button>
		)
	}
}
