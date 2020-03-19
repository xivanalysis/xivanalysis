import classNames from 'classnames'
import React from 'react'
import {Icon} from 'semantic-ui-react'
import styles from './Button.module.css'

type Sizes = 	'mini' |	'small'

interface Props {
	icon?: any,
	circular?: boolean,
	compact?: boolean,
	content?: any,
	nowrap?: boolean,
	size?: Sizes,
	onClick: ()=>void,
}

export class Button extends React.PureComponent<Props> {
	getButtonSize(size: Sizes) {
		switch (size) {
			case 'mini':
				return styles.mini
			case 'small':
				return styles.small
			default:
				return
		}
	}

	render() {
		const {
			icon,
			circular,
			compact,
			content,
			nowrap,
			size,
			onClick,
			children,
		} = this.props

		return (
			<button className={classNames(
				icon && !(content || children) && styles.icon,
				circular && styles.circular,
				compact && styles.compact,
				nowrap && styles.nowrap,
				size && this.getButtonSize(size),
				styles.button,
			)}
			onClick={onClick}>
				{icon && <Icon fitted={!(content || children) ? true : false} name={icon}/>}
				{content ? content : children}
			</button>
		)
	}
}
