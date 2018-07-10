import React from 'react'

import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	getDescription() {
		return <p>This isn&apos;t even remotely done.</p>
	}

	getContributors() {
		return [
			{user: 'ackwell', role: 'Maintainer'},
			{user: 'Nemekh', role: 'Contributor'},
			{user: 'Fryte', role: 'Contributor'},
		]
	}
}
