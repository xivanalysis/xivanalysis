import React from 'react'

interface ListItemProps {
	className?: string,
	[key: string]: any
}

export class TableHeader extends React.PureComponent<ListItemProps> {
	render() {
		const {
			className,
			children,
			...props
		} = this.props

		return (
			<thead {...props} className={className}>
				{children}
			</thead>
		)
	}
}
