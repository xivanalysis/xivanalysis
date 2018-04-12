import React, { Component } from 'react';
import PropTypes from 'prop-types';

class DbLink extends Component {
	static propTypes = {
		obj: PropTypes.shape({
			type: PropTypes.string.isRequired,
			id: PropTypes.number.isRequired,
			name: PropTypes.string
		}).isRequired
	};

	componentDidMount() {
		// Might take a little bit for the tooltip lib to be ready, so just wait it out
		const waitForTooltips = () => {
			if (window.XIVDBTooltips) {
				this.refreshTooltips();
			} else {
				setTimeout(waitForTooltips, 100);
			}
		};
		waitForTooltips();
	}

	refreshTooltips() {
		/* global XIVDBTooltips: true */

		// There's some funky ass shit going on with this library and I don't want to think about it more than I have to.
		// Triggering DOMContentLoaded seems to force it to pick up its ball game
		// I'm... not sure if that'll break something
		try {
			XIVDBTooltips.getOption('fake');
		} catch (TypeError) {
			document.dispatchEvent(new Event('DOMContentLoaded'));
		}

		// Using getDelayed to act as a debounce
		XIVDBTooltips.getDelayed();
	}

	render() {
		const obj = this.props.obj;
		return (
			<a href={'http://xivdb.com/'+ obj.type +'/' + obj.id}>{obj.name ? obj.name : 'Loading...'}</a>
		);
	}
}

export default DbLink;
