import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import STATUSES from 'data/STATUSES'
import React from 'react'

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
	{
		date: new Date('2019-10-29'),
		Changes: () => <>Fix an issue where Technical Flourish windows still considered open if Devilment and Technical Finish fell off at the same instant.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-10-31'),
		Changes: () => <>Updated dropped proc suggestion wording, and fixed a bug with broken combo allowances under Technical Finish.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2019-12-09'),
		Changes: () => <>Technical Finish windows now display how many players were affected by your buff.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2020-05-13'),
		Changes: () => <>Adjust Esprit generation simulation and Technical Windows table to account for multi-dancer parties.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2020-05-10'),
		Changes: () => <>Leniency for rushing finishes at the end of the fight or before a downtime, and suggestions to avoid 0-step finishes.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2020-08-11'),
		Changes: () => <>Added support for patch 5.3</>,
		contributors: [CONTRIBUTORS.CADENCE],
	},
	{
		date: new Date('2021-04-05'),
		Changes: () => <>Significant gauge overhaul. Esprit and Feathers merged into a single analyser and graph output moved into the timeline. Data should be more accurate, though still simulated due to probabilistic generation.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
