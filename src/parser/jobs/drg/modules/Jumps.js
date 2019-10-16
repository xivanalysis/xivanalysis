import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import React, {Fragment} from 'react'

import Module from 'parser/core/Module'
import ACTIONS from 'data/ACTIONS'
import {ActionLink} from 'components/ui/DbLink'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import DISPLAY_ORDER from './DISPLAY_ORDER'
// import {TieredSuggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// cooldowns in ms
const JUMP_CD = ACTIONS.HIGH_JUMP.cooldown * 1000
const SSD_CD = ACTIONS.SPINESHATTER_DIVE.cooldown * 1000
const DFD_CD = ACTIONS.DRAGONFIRE_DIVE.cooldown * 1000

export default class Jumps extends Module {
	static handle = 'jumps';
	static title = t('drg.jump.title')`Jumps`;
	static dependencies = ['checklist', 'downtime'];

	_jumpCount = 0;
	_ssdCount = 0;
	_dfdCount = 0;

	// should start tracking jumps based on when they were first used
	// if they were used outside of the opener, that's a larger problem
	// that deserves a suggestion
	_firstJump = 0;
	_firstSsd = 0;
	_firstDfd = 0;

	_maxJumps = 0;
	_maxDFD = 0;
	_maxSSD = 0;

	constructor(...args) {
		super(...args)

		this.addHook(
			'cast',
			{by: 'player', abilityId: ACTIONS.JUMP.id},
			this._onJump
		)
		this.addHook(
			'cast',
			{by: 'player', abilityId: ACTIONS.HIGH_JUMP.id},
			this._onJump
		)
		this.addHook(
			'cast',
			{by: 'player', abilityId: ACTIONS.SPINESHATTER_DIVE.id},
			this._onSsd
		)
		this.addHook(
			'cast',
			{by: 'player', abilityId: ACTIONS.DRAGONFIRE_DIVE.id},
			this._onDfd
		)
		this.addHook('complete', this._onComplete)
	}

	_computeMaxJumps(start, end, cd, windows) {
		let currentTime = start
		let count = 0

		while (currentTime < end) {
			count += 1
			currentTime += cd

			// check if that falls within a downtime window, if so, current time is now the
			// end of the window
			for (const window of windows) {
				if (window.start <= currentTime && currentTime <= window.end) {
					// inside window, set current to end
					console.log(`within window, ${currentTime} => ${window.end}`)
					currentTime = window.end
				}
			}
		}

		return count
	}

	_getMaxJumpCount() {
		// downtime windows. we'll do a step through, every time we hit a downtime window and
		// the jump comes off cd we'll hold it until the downtime stops
		const windows = this.downtime.getDowntimeWindows()

		this._maxJumps = this._computeMaxJumps(
			this._firstJump,
			this.parser.fight.end_time,
			JUMP_CD,
			windows
		)
		this._maxSSD = this._computeMaxJumps(
			this._firstSsd,
			this.parser.fight.end_time,
			SSD_CD,
			windows
		)
		this._maxDFD = this._computeMaxJumps(
			this._firstDfd,
			this.parser.fight.end_time,
			DFD_CD,
			windows
		)
		console.log(windows)
	}

	_onJump() {
		if (this._firstJump === 0) {
			this._firstJump = this.parser.currentTimestamp
		}

		this._jumpCount += 1
	}

	_onSsd() {
		if (this._firstSsd === 0) {
			this._firstSsd = this.parser.currentTimestamp
		}

		this._ssdCount += 1
	}

	_onDfd() {
		if (this._firstDfd === 0) {
			this._firstDfd = this.parser.currentTimestamp
		}

		this._dfdCount += 1
	}

	_onComplete() {
		this._getMaxJumpCount()
		const jumpTotalPct =
			((this._jumpCount + this._dfdCount + this._ssdCount) /
				(this._maxJumps + this._maxSSD + this._maxDFD)) *
			100

		this.checklist.add(
			new Rule({
				name: (
					<Trans id="drg.jump.checklist.name">Use Your Jumps on Cooldown</Trans>
				),
				description: (
					<Fragment>
						<Trans id="drg.jump.checklist.description">
							Your jumps <ActionLink {...ACTIONS.HIGH_JUMP} />,
							<ActionLink {...ACTIONS.SPINESHATTER_DIVE} />,
							<ActionLink {...ACTIONS.DRAGONFIRE_DIVE} /> should be used as
							close to on cooldown as possible. See the Jumps section for more
							details and the specific jumps that you missed (if any).
						</Trans>
					</Fragment>
				),
				displayOrder: DISPLAY_ORDER.HIGH_JUMP,
				requirements: [
					new Requirement({
						name: (
							<Trans id="drg.jump.checklist.requirement.name">
								<ActionLink {...ACTIONS.HIGH_JUMP} />,
								<ActionLink {...ACTIONS.SPINESHATTER_DIVE} />,
								<ActionLink {...ACTIONS.DRAGONFIRE_DIVE} /> uses (% of max)
							</Trans>
						),
						percent: () => jumpTotalPct,
					}),
				],
				target: 90,
			})
		)
	}

	output() {
		// testing this whole thing out
		return (
			<Fragment>
				<Trans id="drg.jumps.windows.test">
					This is a test output section to debug this in dev module
				</Trans>
				<p>
					You did {this._jumpCount} of {this._maxJumps} jumps in this fight
				</p>
				<p>
					You did {this._ssdCount} of {this._maxSSD} spineshatter dives in this
					fight
				</p>
				<p>
					You did {this._dfdCount} of {this._maxDFD} dragonfire dives in this
					fight
				</p>
			</Fragment>
		)
	}
}
