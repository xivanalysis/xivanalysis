import {Trans} from '@lingui/react'
import {Provider as TooltipProvider, tooltipHOC} from '@xivanalysis/tooltips'
import {ITEM_ID_OFFSET} from 'data/ACTIONS'
import {STATUS_ID_OFFSET} from 'data/STATUSES'
import {useObserver} from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
import {Icon, Popup} from 'semantic-ui-react'
import styles from './DbLink.module.css'
import {StoreContext} from 'store'

// Wrapping the provider w/ the store to pick up lang changes
export const Provider = ({children}) => {
	const {i18nStore} = React.useContext(StoreContext)

	return useObserver(() => (
		<TooltipProvider
			language={i18nStore.gameLanguage}
			apiKey={process.env.REACT_APP_XIVAPI_API_KEY}
		>
			{children}
		</TooltipProvider>
	))
}

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
		iconSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
			iconSize,
		} = this.props

		if (loading) {
			return <span>
				{showIcon && <Icon loading name="circle notch" />}
				{showName && (
					children ||
					name ||
					<Trans id="core.dblink.loading">Loading...</Trans>
				)}
			</span>
		}

		const link = <span>
			{showIcon && <img src={baseUrl + data.icon} alt="" className={styles.image} style={{height: iconSize}}/>}
			{showName && <span className={styles.link}>{children || data.name}</span>}
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
export const ItemLink = props => <Tooltip
	type="Item"
	{...props}
	id={props.id - ITEM_ID_OFFSET}
/>

StatusLink.propTypes = {
	id: PropTypes.number.isRequired,
	showName: PropTypes.bool,
	iconSize: PropTypes.string,
}

ItemLink.propTypes = {
	id: PropTypes.number.isRequired,
}
