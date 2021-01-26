import {ActionLink, StatusLink} from 'components/ui/DbLink'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import STATUSES from 'data/STATUSES'
import React from 'react'
import {Label} from 'semantic-ui-react'

export const changelog = [
	{
		date: new Date('2020-12-16'),
		Changes: () => <>
			Added a module that tracks actions used during <ActionLink {...ACTIONS.RAGING_STRIKES}/> windows.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-12-07'),
		Changes: () => <>
			Support for patch 5.4 - Burst Shot potency adjusted.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-11-15'),
		Changes: () => <>
			GCDs under <ActionLink {...ACTIONS.ARMYS_PAEON}/> and <StatusLink {...STATUSES.ARMYS_MUSE}/> are now dropped from the 'Always Be Casting' uptime calculation.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-08-24'),
		Changes: () => <>
			Simplified the Barrage module and squashed some longstanding bugs with <StatusLink {...STATUSES.RAGING_STRIKES}/> alignment and <StatusLink {...STATUSES.STRAIGHT_SHOT_READY}/> procs.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-08-10'),
		Changes: () => <>
			Support for patch 5.3 - potencies for Burst Shot, Refulgent Arrow, and Sidewinder adjusted.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-08-08'),
		Changes: () => <>
			Added suggestions for ghosted and very weak Apex Arrow casts.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-07-07'),
		Changes: () => <>
			Snapshots module now displays enemies separately. Suggestion added for <ActionLink {...ACTIONS.IRON_JAWS}/> that did not refresh DoTs.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-06-25'),
		Changes: () => <>
			Added a module that shows misused AoE actions.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-06-03'),
		Changes: () => <>
			Updated the Snapshots module to show DoTs separately and filter out unnecessary statuses.
		</>,
		contributors: [CONTRIBUTORS.YUMIYAFANGIRL],
	},
	{
		date: new Date('2020-04-04'),
		Changes: () => <>
			Marked support for up to patch 5.2:
			<ul>
				<li>Updated Straighter Shot status name to Straight Shot Ready</li>
				<li>Added <StatusLink showIcon={false} {...STATUSES.STRAIGHT_SHOT_READY} /> to timeline and realigned <ActionLink showIcon={false} {...ACTIONS.BARRAGE} /> so it's easier to see</li>
				<li>Added data layer for patch 5.1 changes</li>
			</ul>
		</>,
		contributors: [CONTRIBUTORS.ACCHAN],
	},
	{
		date: new Date('2019-07-28'),
		Changes: () => <>
			Big <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> module update: Added checking for windows where there might have been stacks of <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> that went unused.
			<Label color="orange" size="tiny" horizontal pointing="right">NOTE:</Label>We do not know how many unused stacks you have at the end of <ActionLink showIcon={false} {...ACTIONS.THE_WANDERERS_MINUET}/>. This is just a guess where if there were two DoT ticks left after the last use of <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> before the end of <ActionLink showIcon={false} {...ACTIONS.THE_WANDERERS_MINUET}/> that is not during downtime, we point it out.
			Added tracking lost potency from each mistake, Added timeline buttons. Removed the remaining references to repertoire proccing off of DoT crits
		</>,
		contributors: [CONTRIBUTORS.RIRIAN],
	},
	{
		date: new Date('2019-07-24'),
		Changes: () => <>
			Added a new <ActionLink {...ACTIONS.SIDEWINDER}/> and <ActionLink {...ACTIONS.SHADOWBITE}/> module that will
			let you know when you cast either of them on a target that doesn't have both <StatusLink {...STATUSES.CAUSTIC_BITE}/> and <StatusLink {...STATUSES.STORMBITE}/> applied.
			It will also let you know when you cast {ACTIONS.SHADOWBITE.name} on only one target.
		</>,
		contributors: [CONTRIBUTORS.RIRIAN],
	},
	{
		date: new Date('2019-07-22'),
		Changes: () => <>
			Fixed cases where if <ActionLink {...ACTIONS.RAGING_STRIKES}/> was cast pre-pull, the OGCD tracker would fail to recognized it was cast.
		</>,
		contributors: [CONTRIBUTORS.RIRIAN],
	},
]
