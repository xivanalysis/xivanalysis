import React from 'react'

import {StatusLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import STATUSES from 'data/STATUSES'

export const changelog = [
	{
		date: new Date('2019-07-20'),
		Changes: () => <>Suggestions for dance performances and checklist rule for <StatusLink {...STATUSES.STANDARD_FINISH} /> uptime.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-07-28'),
		Changes: () => <>Dancer supported for Shadowbringers.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
