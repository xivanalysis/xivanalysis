import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import Observer from 'react-intersection-observer'

import LANGUAGES from 'data/LANGUAGES'

// Polyfill
import 'intersection-observer'

// -----
// Main link component
// -----
export class DbLink extends Component {
	static propTypes = {
		type: PropTypes.string.isRequired,
		id: PropTypes.number.isRequired,
		name: PropTypes.string,
		language: PropTypes.string.isRequired,
	};

	hasLoaded = false

	constructor(props) {
		super(props)

		this.state = {
			language: props.language,
		}
	}

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

	componentDidUpdate() {
		// If the language changes, we'll need to update the tooltip.
		if (this.state.language !== this.props.language) {
			this.setState({
				language: this.props.language,
			}, () => {
				if (window.XIVDBTooltips) {
					this.refreshTooltips()
				}
			})
		}
	}

	refreshTooltips() {
		/* global XIVDBTooltips: true */

		// Set the appropriate language in XIVDB settings. Set it in
		// the options. Set it in the instance itself if the library
		// is already initialized.
		const lang = LANGUAGES[this.props.language].tooltip

		window.xivdb_tooltips = {
			...window.xivdb_tooltips,
			language: lang,
		}

		if (XIVDBTooltips.options) {
			XIVDBTooltips.options.language = lang
		}

		// Clear the tooltip data attributes from our link to ensure
		// that XIVDB's tooltip helper doesn't just used cached data.
		if (this.link) {
			this.link.removeAttribute('data-xivdb-tooltip')
			this.link.removeAttribute('data-xivdb-key')
			this.link.removeAttribute('data-xivdb-isset')
		}

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
		return <Observer>
			{({inView, ref}) => {
				// We get a ref. Observer gets a ref. Everybody gets a ref!
				const saveRef = el => {
					this.link = el
					return ref(el)
				}

				this.onObserverChange(inView)
				return <a href={'https://xivdb.com/'+ type +'/' + id} ref={saveRef}>{name ? name : 'Loading...'}</a>
			}}
		</Observer>
	}
}

const Wrapped = connect(state => ({
	language: state.language.site,
}))(DbLink)

export default Wrapped

// -----
// Helpers 'cus i'm lazy
// -----
export const ActionLink = (props) => <Wrapped type="action" {...props} />
export const StatusLink = (props) => <Wrapped
	type="status"
	{...props}
	id={props.id - 1000000}
/>

StatusLink.propTypes = {
	id: PropTypes.number.isRequired,
}
