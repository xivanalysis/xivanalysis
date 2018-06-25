import PropTypes from 'prop-types'
import React, {Component, Fragment} from 'react'
import {Checkbox, Item, Label} from 'semantic-ui-react'

// Direct path import 'cus it'll be a dep loop otherwise
import {SEVERITY} from 'parser/core/modules/Suggestions/Suggestion'

import styles from './Suggestions.module.css'

const SEVERITY_LABEL_PROPS = {
	[SEVERITY.MAJOR]: {content: 'Major', color: 'red', icon: 'arrow up'},
	[SEVERITY.MEDIUM]: {content: 'Medium', color: 'orange'},
	[SEVERITY.MINOR]: {content: 'Minor', color: 'blue', icon: 'arrow down'},
}

class Suggestions extends Component {
	static propTypes = {
		suggestions: PropTypes.arrayOf(PropTypes.shape({
			icon: PropTypes.string.isRequired,
			content: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
			why: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
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
				label="Show minor"
				defaultChecked={showMinor}
				onChange={(_, data) => this.setState({showMinor: data.checked})}
				className={styles.checkbox}
			/>}
			<Item.Group>
				{suggestions.map((suggestion, index) => <Item key={index}>
					<Item.Image size="mini" src={suggestion.icon} />
					<Item.Content>
						{suggestion.content}
						<Item.Extra>
							<Label horizontal {...SEVERITY_LABEL_PROPS[suggestion.severity]} />
							{suggestion.why}
						</Item.Extra>
					</Item.Content>
				</Item>)}
				{suggestions.length === 0 && <Item>
					<Item.Content>
						<strong>There&apos;s nothing here!</strong><br/>
						{hasMinor && 'You can check over the minor suggestions by flicking the "Show minor" switch in the top right.'}
					</Item.Content>
				</Item>}
			</Item.Group>
		</Fragment>
	}
}

export default Suggestions
