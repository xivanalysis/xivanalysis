import {DataLink} from 'components/ui/DbLink'
import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-07-12'),
		Changes: () => <>Add positional tracking for <DataLink action="SWIFTSKINS_COIL" /> and <DataLink action="HUNTERS_COIL" /></>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2024-07-11'),
		Changes: () => <>Organize the timeline into groupings for each <DataLink action="DREADWINDER" />, <DataLink action="UNCOILED_FURY" />, and <DataLink action="REAWAKEN" /> combo</>,
		contributors: [CONTRIBUTORS.HINT],
	},
	{
		date: new Date('2024-07-04'),
		Changes: () => <>Initial 7.0 Viper Support</>,
		contributors: [CONTRIBUTORS.RYAN],
	},
]
