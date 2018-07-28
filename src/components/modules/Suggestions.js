import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Checkbox, Label} from 'semantic-ui-react'

// Direct path import 'cus it'll be a dep loop otherwise
import {SEVERITY} from 'parser/core/modules/Suggestions/Suggestion'
import SafeTrans from 'components/ui/SafeTrans'

import styles from './Suggestions.module.css'

const SEVERITY_LABEL_PROPS = {
	[SEVERITY.MORBID]: {content: 'Morbid', color: 'black', icon: 'times'},
	[SEVERITY.MAJOR]: {content: 'Major', color: 'red', icon: 'arrow up'},
	[SEVERITY.MEDIUM]: {content: 'Medium', color: 'orange'},
	[SEVERITY.MINOR]: {content: 'Minor', color: 'blue', icon: 'arrow down'},
}

class Suggestions extends Component {
	static propTypes = {
		suggestions: PropTypes.arrayOf(PropTypes.shape({
			icon: PropTypes.string.isRequired,
			content: PropTypes.node.isRequired,
			why: PropTypes.node.isRequired,
			severity: PropTypes.number.isRequired,
		})).isRequired,
	}

	state = {
		showMinor: false,
	}

	render() {
		const {showMinor} = this.state

		const suggestions = this.props.suggestions.filter(
			suggestion => showMinor || suggestion.severity !== SEVERITY.MINOR
		)

		const hasMinor = this.props.suggestions.some(suggestion => suggestion.severity === SEVERITY.MINOR)

		return <Fragment>
			{hasMinor && <Checkbox
				toggle
				label={<label><SafeTrans id="core.suggestion.show-minor">Show minor</SafeTrans></label>}
				defaultChecked={showMinor}
				onChange={(_, data) => this.setState({showMinor: data.checked})}
				className={styles.checkbox}
			/>}
			<div className={styles.items}>
				{suggestions.map((suggestion, index) => <div key={index} className={styles.item}>
					<img src={suggestion.icon} alt=""/>
					<div>
						<SafeTrans id={suggestion.i18n_id} defaults={suggestion.content} />
						<div className={styles.extra}>
							<Label horizontal {...SEVERITY_LABEL_PROPS[suggestion.severity]} />
							<SafeTrans id={suggestion.i18n_id} defaults={suggestion.why} />
						</div>
					</div>
				</div>)}
				{suggestions.length === 0 && <div className={styles.item}>
					<div>
						<strong><SafeTrans id="core.suggestion.nothing">There's nothing here!</SafeTrans></strong><br/>
						{hasMinor && <SafeTrans id="core.suggestion.nothing-but-minor">You can check over the minor suggestions by flicking the "Show minor" switch in the top right.</SafeTrans>}
					</div>
				</div>}
			</div>
		</Fragment>
	}
}

export default Suggestions
