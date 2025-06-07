import {DataLink} from 'components/ui/DbLink'
import {CONTRIBUTORS} from 'data/CONTRIBUTORS'

export const changelog = [
	// {
	// 	date: new Date('2021-11-19'),
	// 	Changes: () => <>The changes you made</>,
	// 	contributors: [CONTRIBUTORS.YOU],
	// },
	{
		date: new Date('2025-05-18'),
		Changes: () => <>Fix an issue causing over-refunding of Tempera's cooldown when Tempera Grassa breaks.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2025-04-20'),
		Changes: () => <>Add informational display of Swiftcast and Lucid Dreaming usage/cooldown availability adjacent to Defensives.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2025-03-31'),
		Changes: () => <>Remove <DataLink showIcon={false} action="STRIKING_MUSE" /> from cooldowns checklist requirement and update <DataLink showIcon={false} action="STARRY_MUSE" /> window analysis to allow for fewer than three Hammer GCDs.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-12-15'),
		Changes: () => <>Moved tracking for <DataLink showIcon={false} status="HYPERPHANTASIA" /> and <DataLink showIcon={false} status="HAMMER_TIME" /> into Proc Issues.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-11-16'),
		Changes: () => <>Update Canvas timeline display to show which Creature Muse was painted, and fix some bugs with Canvas and Paint state tracking.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-11-16'),
		Changes: () => <>Add a table displaying timestamps when procs were dropped, for better clarity around when those issues occurred.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-08-10'),
		Changes: () => <>Ignore the cure effect of <DataLink showIcon={false} action="STAR_PRISM" /> when looking for weaving issues.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-08-10'),
		Changes: () => <>Fix incorrect uptime calculations caused by erroneous <DataLink showIcon={false} status="INSPIRATION" /> and <DataLink showIcon={false} status="RAINBOW_BRIGHT"/> handling.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2024-08-02'),
		Changes: () => <>Relax the expectation for <DataLink showIcon={false} action="COMET_IN_BLACK" /> usage in <DataLink showIcon={false} action="STARRY_MUSE" /> buff windows.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-19'),
		Changes: () => <>Add analysis for the contents of the <DataLink showIcon={false} action="STARRY_MUSE" /> buff windows.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-17'),
		Changes: () => <>Update Weaving analysis to support the longer-than-normal cast times on Motifs and handle <DataLink showIcon={false} status="INSPIRATION" />'s cast time reduction.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-13'),
		Changes: () => <>Add tracking for, and suggestions to avoid dropping, Pictomancer's procs and the stacking <DataLink showIcon={false} status="HAMMER_TIME" /> and <DataLink showIcon={false} status="HYPERPHANTASIA" /> buffs.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-12'),
		Changes: () => <>Add gauge state tracking for PCT</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-11'),
		Changes: () => <>Add checks for using AoE spells with too few targets</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-07'),
		Changes: () => <>Add <DataLink showIcon={false} action="TEMPERA_GRASSA" /> to Defensives tracking and handle cooldown refunding on shield break from it and <DataLink showIcon={false} action="TEMPERA_COAT" />.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2024-07-03'),
		Changes: () => <>Initial data and core module support for PCT</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
]
