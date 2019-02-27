import {Trans} from '@lingui/react'
import {Provider as TooltipProvider, tooltipHOC} from '@xivanalysis/tooltips'
import {STATUS_ID_OFFSET} from 'data/STATUSES'
import _ from 'lodash'
import {inject, observer} from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
import {Icon, Popup} from 'semantic-ui-react'
import styles from './DbLink.module.css'

// Wrapping the provider w/ the store to pick up lang changes
export const Provider = inject('i18nStore')(observer(({i18nStore, children}) => (
	<TooltipProvider
		language={i18nStore.gameLanguage}
		apiKey={process.env.REACT_APP_XIVAPI_API_KEY}
	>
		{children}
	</TooltipProvider>
)))

class TooltipBase extends React.PureComponent {
	static propTypes = {
		// Props from the HOC
		baseUrl: PropTypes.string,
		loading: PropTypes.bool.isRequired,
		data: PropTypes.oneOfType(PropTypes.object, PropTypes.symbol),
		Content: PropTypes.any,

		// Other props we accept
		children: PropTypes.node,
		showIcon: PropTypes.bool.isRequired,
		showTooltip: PropTypes.bool.isRequired,
		showName: PropTypes.bool.isRequired,
		name: PropTypes.string,

		// Class Name Passthrough
		className: PropTypes.string,
		iconClassName: PropTypes.string,
		nameClassName: PropTypes.string,
	}

	static defaultProps = {
		showIcon: true,
		showTooltip: true,
		showName: true,
	}

	render() {
		// Pull in data from props and state
		const {
			baseUrl,
			loading,
			data,
			Content,

			children,
			showIcon,
			showTooltip,
			showName,
			name,

			className,
			iconClassName,
			nameClassName,
		} = this.props

		if (loading) {
			return <span className={className}>
				{showIcon && <Icon loading name="circle notch" />}
				{showName && (
					children ||
					name ||
					<Trans id="core.dblink.loading">Loading...</Trans>
				)}
			</span>
		}

		const link = <span className={className}>
			{showIcon && <img src={baseUrl + data.icon} alt="" className={_.compact([styles.image, iconClassName]).join(' ')}/>}
			{showName && <span className={_.compact([styles.link, nameClassName]).join(' ')}>{children || data.name}</span>}
		</span>

		if (!showTooltip) {
			return link
		}

		return <Popup
			basic
			style={{padding: '0px'}}
			trigger={link}
			content={<Content/>}
		/>
	}
}

const Tooltip = tooltipHOC(TooltipBase)

export default Tooltip

// Helpers, because ack is lazy. AND PROUD OF IT.
export const ActionLink = props => <Tooltip type="Action" {...props} />
export const StatusLink = props => <Tooltip
	type="Status"
	{...props}
	id={props.id - STATUS_ID_OFFSET}
/>

StatusLink.propTypes = {
	id: PropTypes.number.isRequired,
}
