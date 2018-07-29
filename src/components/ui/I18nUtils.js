import React, {Component, Fragment} from 'react'
import {Popup, List} from 'semantic-ui-react'
import {Trans} from '@lingui/react'

/* eslint react/prop-types: 0 */

export default class I18nUtils extends Component {
	wrapTrans() {
		if (Trans._wrapped) {
			if (Trans._wrapped === this) {
				return
			}

			Trans._wrapped.unwrapTrans()
		}

		Trans._wrapped = this

		const t = this
		const old_render = this.old_render = Trans.prototype.render
		console.log('old render', old_render)

		Trans.prototype.render = function() {
			const content = old_render.call(this)
			if (! content || !t.props.enabled) {
				return content
			}

			const {id, defaults, values} = this.props
			let valueBlock

			if (values) {
				try {
					valueBlock = <Fragment>
						<hr />
						<strong>values:</strong>
						<pre>{
							JSON.stringify(values)
						}</pre>
					</Fragment>

				} catch (err) { /* no-op */ }
			}

			return <Popup trigger={<span className="i18n-segment">{content}</span>} inverted>
				<Popup.Header>
					Localized String
				</Popup.Header>
				<Popup.Content>
					<List>
						<List.Item>
							<strong>id:</strong> {id}
						</List.Item>
						<List.Item>
							<strong>defaults:</strong> {defaults}
						</List.Item>
						{valueBlock}
					</List>
				</Popup.Content>
			</Popup>
		}
	}

	unwrapTrans() {
		if (! Trans._wrapped || Trans._wrapped !== this) {
			return
		}

		Trans.prototype.render = this.old_render
		Trans._wrapped = null
		this.old_render = null
	}

	componentDidMount() {
		this.wrapTrans()
	}

	componentWillUnmount() {
		this.unwrapTrans()
	}

	render() {
		return null
	}

}
