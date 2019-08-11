import React from 'react'

import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import STATUSES from 'data/STATUSES'

export const changelog = [
	{
		date: new Date('2019-07-27'),
		Changes: () => <>Suggestions for dropped and overwritten Procs, does not handle the specific cases where it is better to drop <ActionLink {...ACTIONS.RISING_WINDMILL}/>. </>,
		contributors: [CONTRIBUTORS.TWO_BROKEN],
	},
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
	{
		date: new Date('2019-07-28'),
		Changes: () => <>Dancer supported for Shadowbringers.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-08-05'),
		Changes: () => <>Updated combo logic to allow Fountain to drop if Cascade was used directly before Technical Step.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-08-09'),
		Changes: () => <>Added proc buff display to timeline.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
