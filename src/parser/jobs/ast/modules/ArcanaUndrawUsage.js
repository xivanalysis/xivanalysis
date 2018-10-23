import React, {Fragment} from 'react'

import ACTIONS from 'data/ACTIONS'
// import STATUSES from 'data/STATUSES'
import Module from 'parser/core/Module'

import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'
import {ActionLink} from 'components/ui/DbLink'
import {Trans} from '@lingui/react'
import {Accordion} from 'semantic-ui-react'

const OGCD_ARCANA_REMOVAL = [
	ACTIONS.UNDRAW_SPREAD.id,
	ACTIONS.EMPTY_ROAD.id,
	ACTIONS.UNDRAW.id,
]
// Is there a cleaner way to do this
const AstUndrawMacros = [
	{
		action: 'Undraw',
		content: <Fragment>
			<code>
				<Trans id="ast.arcana-undraw-usage.macros.undraw">
					/statusoff "Bole Drawn"<br/>
					/statusoff "Balance Drawn"<br/>
					/statusoff "Arrow Drawn"<br/>
					/statusoff "Spear Drawn"<br/>
					/statusoff "Spire Drawn"<br/>
					/statusoff "Ewer Drawn"<br/>
					/micon "Undraw"
				</Trans>
			</code>
		</Fragment>,
	},
	{
		action: 'Undraw Spread',
		content: <Fragment>
			<code>
				<Trans id="ast.arcana-undraw-usage.macros.undrawspread">
					/statusoff "Arrow Held"<br/>
					/statusoff "Balance Held"<br/>
					/statusoff "Spire Held"<br/>
					/statusoff "Bole Held"<br/>
					/statusoff "Ewer Held"<br/>
					/statusoff "Spear Held"<br/>
					/micon "Undraw Spread"
				</Trans>
			</code>
		</Fragment>,
	},
	{
		action: 'Empty Road',
		content: <Fragment>
			<code>
				<Trans id="ast.arcana-undraw-usage.macros.emptyroad">
					/statusoff "Expanded Royal Road"<br/>
					/statusoff "Enhanced Royal Road"<br/>
					/statusoff "Extended Royal Road"<br/>
					/micon "Empty Road"
				</Trans>
			</code>
		</Fragment>,
	},
]

export default class ArcanaUndrawUsage extends Module {
	static handle = 'arcanaundraws'
	static dependencies = [
		'suggestions',
	]

	constructor(...args) {
		super(...args)

		this.addHook('cast', {by: 'player'}, this._onCast)
		this.addHook('complete', this._onComplete)
		this._badUndraws = []
	}

	_onCast(event) {

		this._saveIfBadUndraw(event)

	}

	_saveIfBadUndraw(event) {
		const actionId = event.ability.guid

		// It's a OGCD Arcana Undraw. GET IT.
		if (OGCD_ARCANA_REMOVAL.includes(actionId)) {
			this._badUndraws.push(event)
		}
	}

	_onComplete() {

		const badUndraws = this._badUndraws

		if (badUndraws.length) {
			const panels = AstUndrawMacros.map(macro => {
				return {
					key: 'container-' + macro.action,
					title: {
						key: 'title-' + macro.action,
						content: <Fragment>
							{macro.action}
						</Fragment>,
					},
					content: {
						key: 'content-' + macro.action,
						content: macro.content,
					},
				}
			})

			this.suggestions.add(new Suggestion({
				icon: 'https://xivapi.com/i/003000/003108.png', // Undraw action
				content: <Fragment>
					<Trans id="ast.arcana-undraw-usage.suggestions.content">
						<strong>Avoid using the Arcana Removal actions.</strong> (<ActionLink {...ACTIONS.UNDRAW} />) (<ActionLink {...ACTIONS.UNDRAW_SPREAD} />) (<ActionLink {...ACTIONS.EMPTY_ROAD} />) <br/>
					They take up an unnecessary oGCD slot. Instead, try clicking off the relevant buffs or try using macros.</Trans>
					<br/><br/>
					<Accordion
						exclusive={false}
						panels={panels}
						styled
						fluid
					/>
				</Fragment>,
				severity: SEVERITY.MEDIUM,

				why: <Trans id="ast.arcana-undraw-usage.suggestions.why">
					{badUndraws.length} instances of using an ogcd Arcana undraw action.</Trans>,
			}))
		}

	}

}

