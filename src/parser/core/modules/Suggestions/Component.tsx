import {Trans} from '@lingui/react'
import {observer} from 'mobx-react'
import {SEVERITY} from 'parser/core/modules/Suggestions/Suggestion'
import {Component, ContextType, FormEvent} from 'react'
import {Checkbox, CheckboxProps, Label} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {Suggestion} from './Suggestion'
import styles from './Suggestions.module.css'

const SEVERITY_LABEL_PROPS = {
	[SEVERITY.MORBID]: {content: <Trans id="core.suggestions.severity.morbid">Morbid</Trans>, color: 'black', icon: 'times'},
	[SEVERITY.MAJOR]: {content: <Trans id="core.suggestions.severity.major">Major</Trans>, color: 'red', icon: 'arrow up'},
	[SEVERITY.MEDIUM]: {content: <Trans id="core.suggestions.severity.medium">Medium</Trans>, color: 'orange'},
	[SEVERITY.MINOR]: {content: <Trans id="core.suggestions.severity.minor">Minor</Trans>, color: 'blue', icon: 'arrow down'},
	[SEVERITY.MEMES]: {content: <Trans id="code.suggestions.severity.memes">Memes</Trans>, color: 'yellow', icon: 'exclamation'},
} as const

export type SuggestionsProps = {
	suggestions: Suggestion[]
}

@observer
export class Suggestions extends Component<SuggestionsProps> {
	static override contextType = StoreContext
	declare context: ContextType<typeof StoreContext>

	onToggleShowMinor = (_: FormEvent, data: CheckboxProps) => {
		const {settingsStore} = this.context
		settingsStore.setShowMinorSuggestions(!!data.checked)
	}

	override render() {
		const showMinor = this.context.settingsStore.showMinorSuggestions

		const suggestions = this.props.suggestions
			// Always filter IGNORE
			.filter(suggestion => suggestion.severity !== SEVERITY.IGNORE)
			// Filter MINOR if showMinor is not enabled
			.filter(suggestion => showMinor || suggestion.severity !== SEVERITY.MINOR)
			// Sort by severity
			.sort((a, b) => a.severity - b.severity)

		const hasMinor = this.props.suggestions.some(suggestion => suggestion.severity === SEVERITY.MINOR)

		return <>
			{hasMinor && <Checkbox
				toggle
				label={<label><Trans id="core.suggestion.show-minor">Show minor</Trans></label>}
				defaultChecked={showMinor}
				onChange={this.onToggleShowMinor}
				className={styles.checkbox}
			/>}
			<div className={styles.items}>
				{suggestions.map((suggestion, index) => <div key={index} className={styles.item}>
					<img src={suggestion.icon} alt="" />
					<div>
						{suggestion.content}
						<div className={styles.extra}>
							<Label horizontal {...SEVERITY_LABEL_PROPS[suggestion.severity]} />
							{suggestion.why}
						</div>
					</div>
				</div>)}
				{suggestions.length === 0 && <div className={styles.item}>
					<div>
						<strong><Trans id="core.suggestion.nothing">There's nothing here!</Trans></strong><br />
						{hasMinor && <Trans id="core.suggestion.nothing-but-minor">You can check over the minor suggestions by flicking the "Show minor" switch in the top right.</Trans>}
					</div>
				</div>}
			</div>
		</>
	}
}
