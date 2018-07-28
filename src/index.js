import '@babel/polyfill'

import Raven from 'raven-js'
import React from 'react'
import ReactDOM from 'react-dom'

import registerServiceWorker from './registerServiceWorker'
import Root from './Root'

// If we're in prod, boot up sentry
const {NODE_ENV, VERSION, REACT_APP_RAVEN_DSN} = process.env
if (NODE_ENV === 'production' && REACT_APP_RAVEN_DSN) {
	Raven.config(REACT_APP_RAVEN_DSN, {
		environment: NODE_ENV,
		release: VERSION,

		ignoreUrls: [
			// Browser Extensions
			/extensions\//i,
			/^chrome:\/\//i,
			// XIVDB's tooltips fail to load jQuery quite frequently
			/xivdb.com\/tooltips/i,
			// Translate sites break a fair few things
			/translate.google/i,
			/naver\.net/i,
		],
	}).install()
}

ReactDOM.render(<Root />, document.getElementById('root'))
registerServiceWorker()
