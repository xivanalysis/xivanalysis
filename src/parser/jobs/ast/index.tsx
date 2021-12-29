import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {DataLink} from 'components/ui/DbLink'
import TransMarkdown from 'components/ui/TransMarkdown'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

const description = t('ast.about.description-2')`
Playing any healer requires you to carefully manage your MP and cooldowns to efficiently keep your party alive. If you plan out your heals and communicate with your co-healer, you will naturally end up putting out more DPS with the extra GCDs gained.
`

export const ASTROLOGIAN = new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-ast" */),

	Description: () =><>
		<p><Trans id="ast.about.description-1">The biggest <DataLink action="DRAW" /> to an Astrologian is their ability to buff their party DPS with Arcanum.
		This analyzer will show you how the stars work for you and not the other way around</Trans></p>
		<TransMarkdown source={description} key="ast.about.description-2"/>
		<Message warning icon>
			<Icon name="warning sign" />
			<Message.Content>
				<Trans id="ast.about.description.warning.development">
				There's still lots more work to be done for this tool to be comprehensive! If you have a suggestion for what is worth tracking
				please pop by our Discord channel!</Trans>
			</Message.Content>
		</Message>
	</>,
	// supportedPatches: {
	// 	from: '6.0',
	// 	to: '6.0',
	// },
	contributors: [
		{user: CONTRIBUTORS.OTOCEPHALY, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2021-12-22'),
			Changes: () => <>
				<strong>More Endwalker Preparation</strong>
				<ul>
					<li> Fixed some underlying Actions and Statuses to show up on the timeline view properly among other minor changes.</li>
					<li> Updated Overheals to include Delayed Heals. </li>
					<li> Added a section specific to <DataLink action="DIVINATION" /> to show players buffed, GCDs during window, and a warning if cast with another AST.</li>
					<li> Added oGCD heals section on the checklist to show a snapshot of possible rebalancing of healing rotations.</li>
					<li> Reordered Action Timeline specifically separating <DataLink action="MINOR_ARCANA" /> from <DataLink action="PLAY" /> and fixing <DataLink action="MACROCOSMOS" />. </li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.OTOCEPHALY],
		},
		{
			date: new Date('2021-12-03'),
			Changes: () => <>
				<strong>Endwalker Preparation</strong>
				<ul>
					<li> Deleted Sect and Sleeve Draw references.</li>
					<li> Updated actions and statuses from Astrologians.</li>
					<li> Updated arcana tracking to exclude <DataLink action="DIVINATION" /> and <DataLink action="CROWN_PLAY" /></li>
					<li> Updated overheal to include name changes of some healing actions.</li>
					<li> Some minor wording changes including replacing <DataLink action="DIVINATION" /> with <DataLink action="ASTRODYNE" /> where appropriate.</li>
					<li> Added myself as contributor.</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.OTOCEPHALY],
		},
	],
})
