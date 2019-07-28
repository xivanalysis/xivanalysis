import React from 'react'
import {List, Label} from 'semantic-ui-react'

import {ActionLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import ACTIONS from 'data/ACTIONS'

export const changelog = [
	{
		date: new Date('2019-07-28'),
		Changes: () => <>
			Big <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> module update:
			<List size="small">
				<List.Item>
					<List.Content>
						<List.Header>Added checking for windows where there might have been stacks of <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> that went unused.</List.Header>
						<List.Description>
							<Label color="orange" size="tiny" compact horizontal pointing="right">NOTE:</Label>We do not know how many unused stacks you have at the end of <ActionLink showIcon={false} {...ACTIONS.THE_WANDERERS_MINUET}/>. This is just a guess where if there were two DoT ticks left after the last use of <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> before the end of <ActionLink showIcon={false} {...ACTIONS.THE_WANDERERS_MINUET}/> that is not during downtime, we point it out.
						</List.Description>
					</List.Content>
				</List.Item>
				<List.Item>
					<List.Content>
						<List.Header>Added tracking lost potency from each mistake</List.Header>
						<List.Description>Due to the note above, most of the time this will be less potency lost than actually lost.</List.Description>
					</List.Content>
				</List.Item>
				<List.Item>
					<List.Content>
						<List.Header>Added timeline buttons</List.Header>
						<List.Description>For times when <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> was cast without max stacks, this will take you to the point on the timeline where it was cast, for times when we detect a potentially missed PP cast it will take you to the end of that <ActionLink showIcon={false} {...ACTIONS.THE_WANDERERS_MINUET}/> window.</List.Description>
					</List.Content>
				</List.Item>
				<List.Item>
					<List.Content>
						<List.Header>Removed the remaining references to repertoire proccing off of DoT crits</List.Header>
						<List.Description>No longer do you cast <ActionLink showIcon={false} {...ACTIONS.PITCH_PERFECT}/> with two stacks when you have more then 62% critical hit chance</List.Description>
					</List.Content>
				</List.Item>
			</List>
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
