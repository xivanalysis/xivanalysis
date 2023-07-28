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
	supportedPatches: {
		from: '6.0',
		to: '6.45',
	},
	contributors: [
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.MAINTAINER},
		{user: CONTRIBUTORS.OTOCEPHALY, role: ROLES.DEVELOPER},
	],
	changelog: [
		{
			date: new Date('2023-05-24'),
			Changes: () => <>
				<strong>AST Cleanup and <DataLink action="DIVINATION" showIcon={false} /></strong>
				<ul>
					<li> Removed <DataLink action="LIGHTSPEED" /> module and integrated it with <DataLink action="DIVINATION" /> </li>
					<li> Added suggestion for <DataLink action="LIGHTSPEED" /> if not used with <DataLink action="DIVINATION" /> </li>
					<li> Updated <DataLink action="DIVINATION" /> module to align with AST burst window recommendations. </li>
					<li> Reorganized checklist items. </li>
					<li> Added <DataLink action="COLLECTIVE_UNCONSCIOUS" />, <DataLink action="MACROCOSMOS" />, and <DataLink action="EARTHLY_STAR" /> to the defensives checklist. </li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.OTOCEPHALY],
		},
		{
			date: new Date('2022-06-23'),
			Changes: () => <>
				Swapped GCD and Overheal panels in statistics to be consistent with other healers. Fixed translation support for headers in overheal stats.
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2022-01-26'),
			Changes: () => <>
				<strong>6.08 Support</strong>
				<ul>
					<li> Bumped to 6.08 support. No job changes noted for AST and no bugs related to the patch noted. </li>
					<li> Added tinctures module to show rotations during opener and burst windows. </li>
					<li> Added <DataLink action="SWIFTCAST" /> modules for healer suggestion consistency purposes. </li>
					<li> Fixed bug with <DataLink action="HELIOS" /> suggestion where the counter would increase when <DataLink action="HELIOS" showIcon={false} /> (not aspected) is cast and <DataLink action="NEUTRAL_SECT" /> is up since <DataLink action="HELIOS" showIcon={false} /> does not activate <DataLink action="NEUTRAL_SECT" showIcon={false} />. </li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.ARKEVORKHAT, CONTRIBUTORS.OTOCEPHALY],
		},
		{
			date: new Date('2022-01-06'),
			Changes: () => <>
				<strong>6.05 Support</strong>
				<ul>
					<li> Actually fixed <DataLink action="DRAW" /> math instead of whatever the other person (it was me T.T ) did. </li>
					<li> Updated to 6.05 support which didn't involve a whole lot for AST. </li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.OTOCEPHALY],
		},
		{
			date: new Date('2021-12-31'),
			Changes: () => <>
				<strong>Last 6.0 EW Preparation before 6.05</strong>
				<ul>
					<li> Fixed Arcana Tracking to keep seals on death. </li>
					<li> Added <DataLink action="MINOR_ARCANA" /> section to track <DataLink action="LORD_OF_CROWNS" /> and <DataLink action="LADY_OF_CROWNS" /> usages. </li>
					<li> Fixed capped draw math to calculate appropriately given two charges and reworded suggestion to show it relates to cooldown cap. </li>
					<li> Added <DataLink action="MACROCOSMOS" /> suggestions based on either <DataLink action="MACROCOSMOS" showIcon={false} /> or <DataLink action="GRAVITY_II" /> usage. </li>
					<li> Removed <DataLink action="HOROSCOPE" /> and <DataLink action="NEUTRAL_SECT" /> from healing oGCDs section as they supplement helios and aren't solely oGCDs. </li>
					<li> Updated <DataLink action="HOROSCOPE" /> to include <DataLink action="NEUTRAL_SECT" /> as part of a <DataLink action="HELIOS" /> section as the two skills complement each other. </li>
					<li> Updated wording for <DataLink action="UNDRAW" /> to remove reference to <DataLink action="MINOR_ARCANA" />. </li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.OTOCEPHALY],
		},
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
