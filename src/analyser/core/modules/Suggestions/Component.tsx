import {Trans} from '@lingui/react'
import {inject, observer} from 'mobx-react'
import React from 'react'
import {Checkbox, CheckboxProps, Label} from 'semantic-ui-react'
import {SettingsStore} from 'store/settings'
import {Severity, Suggestion} from './Suggestion'

import styles from './Suggestions.module.css'

const SEVERITY_LABEL_PROPS = {
	[Severity.MORBID]: {
		content: <Trans id="core.suggestions.severity.morbid">Morbid</Trans>,
		color: 'black',
		icon: 'times',
	},
	[Severity.MAJOR]: {
		content: <Trans id="core.suggestions.severity.major">Major</Trans>,
		color: 'red',
		icon: 'arrow up',
	},
	[Severity.MEDIUM]: {
		content: <Trans id="core.suggestions.severity.medium">Medium</Trans>,
		color: 'orange',
	},
	[Severity.MINOR]: {
		content: <Trans id="core.suggestions.severity.minor">Minor</Trans>,
		color: 'blue', icon: 'arrow down',
	},
} as const

interface Props {
	settingsStore?: SettingsStore,
	suggestions: Suggestion[],
}

@inject('settingsStore')
@observer
export class SuggestionsComponent extends React.Component<Props> {
	onToggleShowMinor = (_: unknown, data: CheckboxProps) => {
		this.props.settingsStore!.setShowMinorSuggestions(!!data.checked)
	}

	render() {
		const showMinor = this.props.settingsStore!.showMinorSuggestions

		// Sort suggestions with most important at the top, and remove ignored + minor (if requested)
		const suggestions = this.props.suggestions
			.filter(suggestion =>
				suggestion.severity !== undefined &&
				(showMinor || suggestion.severity !== Severity.MINOR),
			)
			.sort((a, b) => a.severity! - b.severity!)

		const hasMinor = this.props.suggestions
			.some(suggestion => suggestion.severity === Severity.MINOR)

		return <>
			{hasMinor && (
				<Checkbox
					toggle
					label={<label><Trans id="core.suggestion.show-minor">Show minor</Trans></label>}
					defaultChecked={showMinor}
					onChange={this.onToggleShowMinor}
					className={styles.checkbox}
				/>
			)}

			<div className={styles.items}>
				{suggestions.map((suggestion, index) => (
					<div key={index} className={styles.item}>
						<img src={suggestion.icon} alt=""/>
						<div>
							{suggestion.content}
							<div className={styles.extra}>
								<Label
									horizontal
									{...SEVERITY_LABEL_PROPS[suggestion.severity!]}
								/>
								{suggestion.why}
							</div>
						</div>
					</div>
				))}

				{suggestions.length === 0 && (
					<div className={styles.item}>
						<div>
							<strong><Trans id="core.suggestion.nothing">There's nothing here!</Trans></strong><br/>
							{hasMinor && <Trans id="core.suggestion.nothing-but-minor">You can check over the minor suggestions by flicking the "Show minor" switch in the top right.</Trans>}
						</div>
					</div>
				)}
			</div>
		</>
	}
}
