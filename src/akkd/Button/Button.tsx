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
	children?: React.ReactNode,
}

export const Button = React.memo(
	function Button(props: Props) {
		const {
			icon,
			content,
			nowrap,
			onClick,
			pill,
			children,
		} = props

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
	},
)
