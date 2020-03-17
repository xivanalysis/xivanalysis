import React from 'react'

interface ListItemProps {
	className?: string,
	[key: string]: any
}

export class TableBody extends React.PureComponent<ListItemProps> {
	render() {
		const {
			className,
			children,
			...props
		} = this.props

		return (
			<tbody {...props} className={className}>
				{children}
			</tbody>
		)
	}
}
