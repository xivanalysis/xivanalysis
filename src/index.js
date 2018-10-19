import '@babel/polyfill'
import 'intersection-observer'

import Raven from 'raven-js'
import React from 'react'
import ReactDOM from 'react-dom'

import Root from './Root'

// If we're in prod, boot up sentry
const {NODE_ENV, REACT_APP_VERSION, REACT_APP_RAVEN_DSN} = process.env
if (NODE_ENV === 'production' && REACT_APP_RAVEN_DSN) {
	Raven.config(REACT_APP_RAVEN_DSN, {
		environment: NODE_ENV,
		release: REACT_APP_VERSION,

		whitelistUrls: [
			// All our project's JavaScript should be loaded from /static/
			/xivanalysis\.com\/static/,
		],

		ignoreUrls: [
			// Browser Extensions
			/extensions\//i,
			/^chrome:\/\//i,
			// XIVDB's tooltips fail to load jQuery quite frequently
			/xivdb.com\/tooltips/i,
			// Translate sites break a fair few things
			/translate\.google/i,
			/naver\.net/i,
		],
		ignoreErrors: [
			// As I was saying, translate sites...
			'SecurityError',
		],
	}).install()
}

ReactDOM.render(<Root />, document.getElementById('root'))

// Make sure there isn't a service worker running, it doesn't really work with what we do
// Code ✂️'d from CRA@2's generated thing
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.ready.then(registration => {
		registration.unregister()
	})
}
