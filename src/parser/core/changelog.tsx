//import {DataLink} from 'components/ui/DbLink'
import {CONTRIBUTORS} from 'data/CONTRIBUTORS'
import {ChangelogEntry} from './Meta'

export const changelog: ChangelogEntry[] = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2025-01-28'),
		Changes: () => <>Fix recently introduced checklist requirement bugs.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2025-01-26'),
		Changes: () => <>Updated Overheal analysis for all healers and Blue Mage.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2025-01-04'),
		Changes: () => <>Fixed an issue where raid buff overwrite analysis incorrectly reported issues when the other player was in a different alliance party. </>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-12-03'),
		Changes: () => <>Fixed an issue with gauge stack backtrack corrections when modified by events prior to the start of combat.</>,
		contributors: [CONTRIBUTORS.AKAIRYU, CONTRIBUTORS.AZARIAH, CONTRIBUTORS.OTOCEPHALY],
	},
	{
		date: new Date('2024-12-03'),
		Changes: () => <>Fixed an issue causing initial hits on newly spawned adds to sometimes be treated as hits against an invulnerable target.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-11-21'),
		Changes: () => <>Fixed prepull actions for defensives for duplicates, weird counts, and missing suggested available times. </>,
		contributors: [CONTRIBUTORS.AKAIRYU, CONTRIBUTORS.AZARIAH, CONTRIBUTORS.OTOCEPHALY],
	},
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
