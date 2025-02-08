import {withI18n} from '@lingui/react'
import * as PropTypes from 'prop-types'
import {PureComponent} from 'react'
import ReactMarkdown from 'react-markdown'

class TransMarkdown extends PureComponent {
	static propTypes = {
		i18n: PropTypes.shape({
			_: PropTypes.func.isRequired,
		}),
		source: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				defaults: PropTypes.string,
				values: PropTypes.object,
			}),
		]).isRequired,
		renderers: PropTypes.object,
		linkTarget: PropTypes.string,
	}

	render() {
		const {i18n, source, renderers} = this.props

		// i18n might not be ready yet, load the default as a fallback
		// ridiculous .replace because lingui is pants on head and escaped the escape characters.
		const finalSource = i18n
			? i18n._(source).replace(/\\`/g, '`')
			: typeof source === 'string'? source : (source.defaults || '')

		return <ReactMarkdown
			source={finalSource}
			renderers={renderers}
		/>
	}
}

export default withI18n()(TransMarkdown)
