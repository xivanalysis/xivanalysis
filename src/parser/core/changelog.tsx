import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'
import {ChangelogEntry} from './Meta'

export const changelog: ChangelogEntry[] = [{
	date: new Date('2019-08-14'),
	Changes: () => <>Fix actor filters for secondary event query. Raid buffs applied by other players should be visible again.</>,
	contributors: [CONTRIBUTORS.ACKWELL],
}, {
	date: new Date('2019-07-20'),
	Changes: () => <>Add handling for GCD actions with recasts longer than the player GCD. This should impove GCD estimation accuracy and timeline display for DNC, GNB, and MCH.</>,
	contributors: [CONTRIBUTORS.ACKWELL],
}]
