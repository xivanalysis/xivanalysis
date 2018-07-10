import React from 'react'

import CONTRIBUTORS from 'data/CONTRIBUTORS'
import CoreAbout from 'parser/core/modules/About'

export default class About extends CoreAbout {
	getDescription() {
		return <p>This isn&apos;t even remotely done.</p>
	}

	getContributors() {
		return [
			{user: CONTRIBUTORS.ACKWELL, role: 'Maintainer'},
			{user: CONTRIBUTORS.NEMEKH, role: 'Contributor'},
			{user: CONTRIBUTORS.FRYTE, role: 'Contributor'},
		]
	}
}
