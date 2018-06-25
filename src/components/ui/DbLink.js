import PropTypes from 'prop-types'
import React, {Component} from 'react'
import Observer from 'react-intersection-observer'

// Polyfill
import 'intersection-observer'

// -----
// Main link component
// -----
export default class DbLink extends Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		id: PropTypes.number.isRequired,
		name: PropTypes.string,
	};

	hasLoaded = false

	onObserverChange(isVisible) {
		if (!this.hasLoaded && isVisible) {
			// Might take a little bit for the tooltip lib to be ready, so just wait it out
			const waitForTooltips = () => {
				if (window.XIVDBTooltips) {
					this.refreshTooltips()
				} else {
					setTimeout(waitForTooltips, 100)
				}
			}
			waitForTooltips()
		}
	}

	refreshTooltips() {
		/* global XIVDBTooltips: true */

		// There's some funky ass shit going on with this library and I don't want to think about it more than I have to.
		// Triggering DOMContentLoaded seems to force it to pick up its ball game
		// I'm... not sure if that'll break something
		try {
			XIVDBTooltips.getOption('fake')
		} catch (TypeError) {
			document.dispatchEvent(new Event('DOMContentLoaded'))
		}

		// Using getDelayed to act as a debounce
		this.hasLoaded = true
		XIVDBTooltips.getDelayed()
	}

	render() {
		const {type, id, name} = this.props
		return <Observer tag="span" onChange={isVisible => this.onObserverChange(isVisible)}>
			<a href={'http://xivdb.com/'+ type +'/' + id}>{name ? name : 'Loading...'}</a>
		</Observer>
	}
}

// -----
// Helpers 'cus i'm lazy
// -----
export const ActionLink = (props) => <DbLink type="action" {...props} />
export const StatusLink = (props) => <DbLink
	type="status"
	{...props}
	id={props.id - 1000000}
/>

StatusLink.propTypes = {
	id: PropTypes.number.isRequired,
}
