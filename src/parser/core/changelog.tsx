import {DataLink} from 'components/ui/DbLink'
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
		date: new Date('2023-07-28'),
		Changes: () => <>
			Fix a bug with status application event ordering that sometimes caused extra action uses to by synthesized.
		</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2023-07-27'),
		Changes: () => <>
			Improve GCD estimation from FFLogs reports.
		</>,
		contributors: [CONTRIBUTORS.HINT, CONTRIBUTORS.AYA],
	},
	{
		date: new Date('2023-07-11'),
		Changes: () => <>
			Better handling for defensives with a shared cooldown, and fix a bug with the extra use available calculations.
		</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2023-07-09'),
		Changes: () => <>
			Fixed prepull actions for defensive cooldowns module.
			Fixed some bugs relating to weaving issues and party member deaths.
			Updated weaving issues into a more-consistent format with other modules.
		</>,
		contributors: [CONTRIBUTORS.OTOCEPHALY],
	},
	{
		date: new Date('2023-05-24'),
		Changes: () => <>
			Overhaul defensive cooldown analysis for all jobs, including role actions by default.
		</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2023-01-22'),
		Changes: () => <>
			Fix event ordering inaccuracies when a buff application and a damage event occur on the same timestamp.
		</>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2022-04-20'),
		Changes: () => <>Update core raid buffs to use the correct NIN buff name in timeline.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-03-29'),
		Changes: () => <>
			Update Always Be Casting to target 98% and show at top of checklist.
		</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-17'),
		Changes: () => <>
			Allow core Procs to hide the timeline row. This was previously enforced, jobs can now hide it.
			This is useful for jobs that have GCDs with lots of procs getting duplicated information.
		</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-12'),
		Changes: () => <>Make core Procs counter values accessible to job-specific overrides.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-02-11'),
		Changes: () => <>
			Fix Swiftcast end of fight forgiveness. It was increasing the number of expected GCDs to 2 instead of reducing it to 0.
		</>,
		contributors: [CONTRIBUTORS.DEAN],
	},
	{
		date: new Date('2022-02-01'),
		Changes: () => <>Added positionals.</>,
		contributors: [CONTRIBUTORS.DEAN],
	},
	{
		date: new Date('2022-01-31'),
		Changes: () => <>
			Fix overcorrection caused by prior death-related changes that were leading to player deaths being ignored.
			Due to inaccuracies in data provided by FF Logs, this will cause deaths to be reported a few seconds after the actual time of death in-game.
			This will impact analysis, but should be relatively minimal overall.
		</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2022-01-29'),
		Changes: () => <>
			Prevent erroneous 0 HP updates from FF Logs report sources marking the player as dead.
			This should resolve incorrect death flags due to tank invulnerabilities and mechanics such as Death's Toll.
		</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2022-01-22'),
		Changes: () => <>Add proper severity types to core Procs overrides.</>,
		contributors: [CONTRIBUTORS.AY],
	},
	{
		date: new Date('2022-01-12'),
		Changes: () => <>Improve enemy targetability detection when a target raises during a fight (e.g. striking dummies)</>,
		contributors: [CONTRIBUTORS.AZARIAH],
	},
	{
		date: new Date('2022-01-12'),
		Changes: () => <>Fixed a bug causing some weaving issues with recast times.</>,
		contributors: [CONTRIBUTORS.AZARIAH, CONTRIBUTORS.OTOCEPHALY],
	},
	{
		date: new Date('2022-01-10'),
		Changes: () => <>Finalise core support for 6.05.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2022-01-09'),
		Changes: () => <>Fixed a bug causing some player cooldowns that apply statuses to be missing from the timeline.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2022-01-05'),
		Changes: () => <>Improved display of action-applied statuses in the timeline. This fixes durations on statuses such as <DataLink status="DEATHS_DESIGN"/>, and shows applications on a target-by-target basis.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2022-01-03'),
		Changes: () => <>Fixed a bug causing errors in gauge value simulations under certain circumstances.</>,
		contributors: [CONTRIBUTORS.AKAIRYU],
	},
	{
		date: new Date('2022-01-03'),
		Changes: () => <>
			Use report-provided attribute values to calculate GCD recast time.
			These values are only available for the player who logged and uploaded the report.
			Other players in the report will continue to recieve estimates.
		</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	},
	{
		date: new Date('2021-12-31'),
		Changes: () => <>Changed the lowest GCD that the weaving module allows to double-weave under from 2000 ms to 1800 ms.</>,
		contributors: [CONTRIBUTORS.FURST],
	},
	{
		date: new Date('2021-12-16'),
		Changes: () => <>Added Arcane Circle, Radiant Finale, and Searing Light raid buffs to the timeline.</>,
		contributors: [CONTRIBUTORS.HINT],
	},

]
