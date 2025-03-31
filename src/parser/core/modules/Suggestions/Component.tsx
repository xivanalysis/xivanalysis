import {Trans} from '@lingui/react'
import {observer} from 'mobx-react'
import {SEVERITY} from 'parser/core/modules/Suggestions/Suggestion'
import {Component, ContextType, FormEvent} from 'react'
import {Checkbox, CheckboxProps, Label} from 'semantic-ui-react'
import {StoreContext} from 'store'
import {Suggestion} from './Suggestion'
import styles from './Suggestions.module.css'

// NOTE: For no discernable reason, i18n tooling freaks out on this file, and
// this file alone - so we're using the non-macro translation tag to avoid the
// issue. Good times.

const SEVERITY_LABEL_PROPS = {
	[SEVERITY.MORBID]: {content: <Trans id="core.suggestions.severity.morbid" message="Morbid"/>, color: 'black', icon: 'times'},
	[SEVERITY.MAJOR]: {content: <Trans id="core.suggestions.severity.major" message="Major"/>, color: 'red', icon: 'arrow up'},
	[SEVERITY.MEDIUM]: {content: <Trans id="core.suggestions.severity.medium" message="Medium"/>, color: 'orange'},
	[SEVERITY.MINOR]: {content: <Trans id="core.suggestions.severity.minor" message="Minor"/>, color: 'blue', icon: 'arrow down'},
	[SEVERITY.MEMES]: {content: <Trans id="code.suggestions.severity.memes" message="Memes"/>, color: 'yellow', icon: 'exclamation'},
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
				label={<label><Trans id="core.suggestion.show-minor" message="Show minor"/></label>}
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
						<strong><Trans id="core.suggestion.nothing" message="There's nothing here!"/></strong><br />
						{hasMinor && <Trans id="core.suggestion.nothing-but-minor" message='You can check over the minor suggestions by flicking the "Show minor" switch in the top right.'/>}
					</div>
				</div>}
			</div>
		</>
	}
}
