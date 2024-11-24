//import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'
import {ChangelogEntry} from './Meta'

export const changelog: ChangelogEntry[] = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2024-11-13'),
		Changes: () => <>Fix status icon assets in response to a change in the underlying game data.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-11-10'),
		Changes: () => <>Fixed an issue causing GCD uptime calculation to be overly generous when a pull ended on an instant-casted spell that normally has a cast time.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-08-27'),
		Changes: () => <>Added blurb and feature for defensives with charges.</>,
		contributors: [CONTRIBUTORS.OTOCEPHALY],
	},
	{
		date: new Date('2024-08-23'),
		Changes: () => <>Resolve an issue that could cause raid buff analysis to report fewer players buffed than there actually were.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-08-10'),
		Changes: () => <>Fix uptime calculations for precast and end-of-fight actions.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2024-07-03'),
		Changes: () => <>Update core support for the Dawntrail expansion</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
