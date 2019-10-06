import '@babel/polyfill'
import 'intersection-observer'
import 'whatwg-fetch'

import * as Sentry from '@sentry/browser'
import React from 'react'
import ReactDOM from 'react-dom'

import Root from './Root'

// If we're in prod, boot up sentry
const {NODE_ENV, REACT_APP_VERSION, REACT_APP_SENTRY_DSN} = process.env
if (NODE_ENV === 'production' && REACT_APP_SENTRY_DSN) {
	Sentry.init({
		dsn: REACT_APP_SENTRY_DSN,
		environment: NODE_ENV,
		release: REACT_APP_VERSION,

		whitelistUrls: [
			// All our project's JavaScript should be loaded from /assets/
			/xivanalysis\.com\/assets/,
		],
		blacklistUrls: [
			// Browser Extensions
			/extensions\//i,
			/^chrome:\/\//i,
			// Translate sites break a fair few things
			/translate\.google/i,
			/naver\.net/i,
		],
		ignoreErrors: [
			// As I was saying, translate sites...
			'SecurityError',
		],
	})
}

ReactDOM.render(<Root />, document.getElementById('root'))

// Make sure there isn't a service worker running, it doesn't really work with what we do
// Code ✂️'d from CRA@2's generated thing
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.ready.then(registration => {
		registration.unregister()
	})
}
