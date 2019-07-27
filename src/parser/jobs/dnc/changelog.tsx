import React from 'react'

import {StatusLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import STATUSES from 'data/STATUSES'

export const changelog = [
	{
		date: new Date('2019-07-26'),
		Changes: () => <>Baseline <StatusLink {...STATUSES.ESPRIT} /> gauge implementation.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-07-26'),
		Changes: () => <>Suggestion for not using Devilment outside Technical Finish windows other than the opener.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-07-26'),
		Changes: () => <>Baseline feather gauge implementation.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-07-20'),
		Changes: () => <>Suggestions for dance performances and checklist rule for <StatusLink {...STATUSES.STANDARD_FINISH} /> uptime.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
