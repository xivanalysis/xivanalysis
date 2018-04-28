// wow has dots spread across multiple files? dunno ey. this is pretty temp.
import React, { Fragment } from 'react'
import Module from 'parser/core/Module'
import STATUSES from 'data/STATUSES'

export default class DoTs extends Module {
	static dependencies = [
		'enemies'
	]

	output() {
		const fightLength = this.parser.fightDuration
		const bioUptime = this.enemies.getStatusUptime(STATUSES.BIO_III.id)/fightLength
		const miasmaUptime = this.enemies.getStatusUptime(STATUSES.MIASMA_III.id)/fightLength

		return <Fragment>
			<ul>
				<li>B3: {bioUptime}</li>
				<li>M3: {miasmaUptime}</li>
			</ul>
		</Fragment>
	}
}
