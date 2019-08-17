import React from 'react'
import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {RotationTable} from 'components/ui/RotationTable'
import {ActionLink} from 'components/ui/DbLink'

import {BuffWindowModule} from 'parser/core/modules/BuffWindow'
import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'
import {SEVERITY} from 'parser/core/modules/Suggestions'
import {getDataBy} from 'data/getDataBy'

export default class Swiftcast extends BuffWindowModule {
	static handle = 'swiftcast'
	static title = t('core.swiftcast.title')`Swiftcasts`

	buffAction = ACTIONS.SWIFTCAST
	buffStatus = STATUSES.SWIFTCAST

	expectedGCDs = {
		expectedPerWindow: 1,
		suggestionContent: <Trans id="core.swiftcast.suggestions.missedgcd.content">
			Try to use at least one move during every <ActionLink {...ACTIONS.SWIFTCAST} />
		</Trans>,
		severityTiers: {
			1: SEVERITY.MAJOR,
		},
	}

	// override to only use gcd casts
	onCast(event) {
		const action = getDataBy(ACTIONS, 'id', event.ability.guid)

		if (!action || action.autoAttack || !action.castTime) {
			return
		}

		if (this.activeBuffWindow) {
			this.activeBuffWindow.rotation.push(event)
		}
	}

	// sooper hacky...
	output() {
		const rotationData = this.buffWindows
			.map(buffWindow => {
				const windowStart = buffWindow.start - this.parser.fight.start_time
				const windowEnd = (buffWindow.end != null ? buffWindow.end : buffWindow.start) - this.parser.fight.start_time
				const targetsData = {}

				if (this.expectedGCDs) {
					targetsData.missedgcd = {
						actual: buffWindow.gcds,
						expected: this.getBuffWindowExpectedGCDs(buffWindow),
					}
				}

				if (this.requiredGCDs) {
					targetsData.badgcd = {
						actual: this.getBuffWindowRequiredGCDsUsed(buffWindow),
						expected: this.getBuffWindowExpectedGCDs(buffWindow),
					}
				}

				if (this.trackedActions) {
					this.trackedActions.actions.forEach((trackedAction) => {
						targetsData[trackedAction.action.name] = {
							actual: buffWindow.getActionCountByIds([trackedAction.action.id]),
							expected: this.getBuffWindowExpectedTrackedActions(buffWindow, trackedAction),
						}
					})
				}

				return {
					start: windowStart,
					end: windowEnd,
					targetsData,
					rotation: buffWindow.rotation,
				}
			})

		return <RotationTable
			data={rotationData}
			onGoto={this.timeline.show}
		/>
	}

}
