import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {Popup, List} from 'semantic-ui-react'
import {Trans} from '@lingui/react'

import _ from 'lodash'

import styles from './I18nOverlay.module.css'

export default class I18nOverlay extends Component {
	static propTypes = {
		enabled: PropTypes.bool.isRequired,
		language: PropTypes.string.isRequired,
	}

	state = {
		catalogs: {},
	}

	async loadCatalog(language) {
		const rawCatalog = await import(
			/* webpackMode: 'lazy', webpackChunkName: 'i18n-[index]-raw' */
			`!raw-loader!../../locale/${language}/messages.json`
		)

		let catalog

		try {
			catalog = JSON.parse(rawCatalog.default)
		} catch (err) {
			catalog = null
		}

		this.setState(state => ({
			catalogs: {
				...state.catalogs,
				[language]: catalog,
			},
		}))
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {language} = nextProps
		const {catalogs} = nextState

		if (language !== this.props.language && !catalogs[language]) {
			this.loadCatalog(language)
			return false
		}

		return true
	}

	componentDidMount() {
		const {enabled, language} = this.props
		this.loadCatalog(language)

		if (enabled) {
			this.wrapTrans()
		}
	}

	componentDidUpdate() {
		if (this.props.enabled) {
			this.wrapTrans()
		} else {
			this.unwrapTrans()
		}
	}

	componentWillUnmount() {
		this.unwrapTrans()
	}

	tryUpdate() {
		const fiber = this._reactInternalFiber
		const parent = fiber && fiber.return && fiber.return.stateNode
		const lingui = parent && parent.linguiPublisher

		if (lingui) {
			lingui.getSubscribers().forEach(f => f())
		}
	}

	render() {
		return null
	}

	renderTooltip(instance) {
		const {id, defaults, values} = instance.props
		const i18nParent = instance.context.linguiPublisher || {}
		const i18n = i18nParent && i18nParent.i18n

		let valueBlock, i18nBlock
		let translated = true

		if (values) {
			try {
				valueBlock = <>
					<hr />
					<strong>values:</strong>
					<pre>{ _.map(values, (val, key) => `${key}: ${JSON.stringify(val)}`) }</pre>
				</>
			} catch (err) { /* no-op */ }
		}

		if (id && i18n) {
			const lang = i18n.language
			const catalog = this.state.catalogs[lang]
			const msg = catalog && catalog[id]
			if (!msg) {
				translated = false
			}

			i18nBlock = <>
				<hr />
				<List>
					<List.Item>
						<strong>lang:</strong> {lang}
					</List.Item>
					<List.Item>
						<strong>translation:</strong> {
							msg ? msg : <em>&lt;not set&gt;</em>
						}
					</List.Item>
				</List>
			</>
		}

		return {
			id,
			translated,
			tooltip: <>
				<Popup.Header>
					Localized String
				</Popup.Header>
				<Popup.Content>
					<List>
						<List.Item>
							<strong>id:</strong> {id ? id : <em>&lt;not set&gt;</em>}
						</List.Item>
						<List.Item>
							<strong>defaults:</strong> {defaults}
						</List.Item>
					</List>
					{valueBlock}
					{i18nBlock}
				</Popup.Content>
			</>,
		}
	}

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

		Trans.prototype.render = function() {
			const content = old_render.call(this)
			if (! content || !t.props.enabled) {
				return content
			}

			const {id, translated, tooltip} = t.renderTooltip(this)

			return <Popup trigger={<span className={`${styles.segment} ${translated ? '' : styles.notTranslated} ${id ? '' : styles.missingId}`}>{content}</span>} inverted>{
				tooltip
			}</Popup>
		}

		this.tryUpdate()
	}

	unwrapTrans() {
		if (! Trans._wrapped || Trans._wrapped !== this) {
			return
		}

		Trans.prototype.render = this.old_render
		Trans._wrapped = null
		this.old_render = null
		this.tryUpdate()
	}
}
