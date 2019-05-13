import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'
import {Meta} from './Meta'

export default new Meta({
	modules: () => import('./modules' /* webpackChunkName: "core" */),
	changelog: [{
		date: new Date('2018-11-22'),
		Changes: () => <>Prevented hits that do zero damage from counting towards AoE hit counts.</>,
		contributors: [CONTRIBUTORS.ACKWELL],
	}],
})
