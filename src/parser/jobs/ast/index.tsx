import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {ActionLink} from 'components/ui/DbLink'
import TransMarkdown from 'components/ui/TransMarkdown'
import ACTIONS from 'data/ACTIONS'
import CONTRIBUTORS, {ROLES} from 'data/CONTRIBUTORS'
import {Meta} from 'parser/core/Meta'
import React from 'react'
import {Icon, Message} from 'semantic-ui-react'

const description = t('ast.about.description-2')`
Playing any healer requires you to carefully manage your MP and cooldowns to efficiently keep your party alive. If you plan out your heals and communicate with your co-healer, you will naturally end up putting out more DPS with the extra GCDs gained.
`

export default new Meta({
	modules: () => import('./modules' /*webpackChunkName: "jobs-ast" */),

	Description: () =><>
		<p><Trans id="ast.about.description-1">The biggest <ActionLink {...ACTIONS.DRAW} /> to an Astrologian is their ability to buff their party DPS with Arcanum.
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
		from: '5.05',
		to: '5.2',
	},
	contributors: [
		{user: CONTRIBUTORS.SUSHIROU, role: ROLES.MAINTAINER},
	],
	changelog: [
		{
			date: new Date('2020-04-29'),
			Changes: () => <>
				Updated AST for 5.1 & 5.2
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-10-08'),
			Changes: () => <>
				Fixed bug where the target of the card wouldn't display if that target was yourself.
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-09-25'),
			Changes: () => <>
				<ActionLink {...ACTIONS.SYNASTRY} /> now triggers a minor suggestion for single-target heals without it despite it being available.
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-09-01'),
			Changes: () => <>
				<ActionLink {...ACTIONS.CELESTIAL_OPPOSITION} /> now triggers a suggestion for dropping uses.
				<ActionLink {...ACTIONS.DIVINATION} /> gets its own checklist tracker.
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-08-10'),
			Changes: () => <>
				<ActionLink {...ACTIONS.HOROSCOPE} /> reworked tracking for accuracy
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-08-08'),
			Changes: () => <>
				<strong>Get more of those cards</strong>:
				<ul>
					<li>Calculation for number of <ActionLink {...ACTIONS.PLAY} /> in a fight</li>
					<li>Suggestions for not keeping (<ActionLink {...ACTIONS.DRAW} /><ActionLink {...ACTIONS.SLEEVE_DRAW} />) on cooldown</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-07-30'),
			Changes: () => <>
				<strong>5.05 Support</strong>:
				<ul>
					<li>Ability cast times and cooldowns updated for 5.05</li>
					<li>(<ActionLink {...ACTIONS.SLEEVE_DRAW} />) Arcana logs updated for 5.05</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{

			date: new Date('2019-07-27'),
			Changes: () => <>
				<strong>Overheal and Celestial Intersection modules</strong>:
				<ul>
					<li>(<ActionLink {...ACTIONS.CELESTIAL_INTERSECTION} />) Throws a suggestion for infrequent usage</li>
					<li>Added an overheal checklist, which counts both heals and HoT percentage overheals for better clarity into the matter.</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-07-22'),
			Changes: () => <>
				<strong>Sect detection and Combust improvements</strong>:
				<ul>
					<li>(<ActionLink {...ACTIONS.COMBUST_III} />) Added warn tier at 85-90%</li>
					<li>(<ActionLink {...ACTIONS.DIURNAL_SECT} /><ActionLink {...ACTIONS.NOCTURNAL_SECT} />) Added support for modules to make Sect specific suggestions. <br/>
					Triggers a suggestion if player pulled without a sect on, and if they used Noct while healing with a Scholar</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-07-23'),
			Changes: () => <>
				<strong>Arcana play logs support for Shadowbringers</strong>:
				<ul>
					<li>(<ActionLink {...ACTIONS.PLAY} />) Arcana Logs are back up, now includes prepull Plays</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
		{
			date: new Date('2019-07-11'),
			Changes: () => <>
				<strong>Basic support for Shadowbringers</strong>:
				<ul>
					<li>(<ActionLink {...ACTIONS.COMBUST_III} />) DoT update</li>
					<li>(<ActionLink {...ACTIONS.UNDRAW} />) Using it triggers suggestion not to use it</li>
					<li>(<ActionLink {...ACTIONS.LUCID_DREAMING} />, <ActionLink {...ACTIONS.LIGHTSPEED} />) Message update</li>
					<li>(<ActionLink {...ACTIONS.HOROSCOPE} />) Failing to read the cards again triggers suggestion</li>
					<li>(<ActionLink {...ACTIONS.PLAY} />) Coming soon™</li>
					<li>Made improvements to timeline CD display - merged draw actions, displaying horoscope and earthly detonations</li>
				</ul>
			</>,
			contributors: [CONTRIBUTORS.SUSHIROU],
		},
	],
})
