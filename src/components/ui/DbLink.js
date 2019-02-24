import {Trans} from '@lingui/react'
import {
	Provider as TooltipProvider,
	tooltipHOC,
} from '@xivanalysis/tooltips'
import {observer, inject} from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
import {Popup, Icon} from 'semantic-ui-react'

import {STATUS_ID_OFFSET} from 'data/STATUSES'

import styles from './DbLink.module.css'

// Wrapping the provider w/ the store to pick up lang changes
export const Provider = inject('i18nStore')(observer(({i18nStore, children}) => (
	<TooltipProvider
		language={i18nStore.siteLanguage}
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
			{showIcon && <img src={baseUrl + data.icon} alt="" className={styles.image}/>}
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

StatusLink.propTypes = {
	id: PropTypes.number.isRequired,
}
