import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {Popup, Icon} from 'semantic-ui-react'
import {Trans} from '@lingui/react'

import _ from 'lodash'

import styles from './DbLink.module.css'

import LANGUAGES from 'data/LANGUAGES'

function getTooltipCacheBuster() {
	const now = new Date()
	return `${now.getFullYear()}${now.getDate()}`
}

export class XIVDBTooltipProvider {
	static _instance = null

	static getInstance() {
		if (this._instance) {
			return this._instance
		}

		return this._instance = new this()
	}

	constructor(source = 'https://secure.xivdb.com', delay = 50) {
		this.source = source

		this.cache = {}
		this.pending = {}

		// Make sure we have the styles
		const tooltipStyle = document.createElement('link')
		tooltipStyle.href = `${this.source}/tooltips.css?v=${getTooltipCacheBuster()}`
		tooltipStyle.rel = 'stylesheet'
		tooltipStyle.type = 'text/css'

		document.head.appendChild(tooltipStyle)

		// Debounce our processing method to avoid API spam.
		this.run = _.debounce(this._process.bind(this), delay)
	}

	_process() {
		const pending = this.pending
		this.pending = {}

		for (const [language, types] of Object.entries(pending)) {
			const languageCache = this.cache[language] = this.cache[language] || {}
			const params = new URLSearchParams()
			params.append('language', language)

			for (const [type, values] of Object.entries(types)) {
				params.append(`list[${type}]`, values)
			}

			fetch(`${this.source}/tooltip?t=${Date.now()}`, {
				method: 'POST',
				body: params,

			}).then(resp => resp.json()).then(data => {
				if (! data || typeof data !== 'object') {
					console.log('Invalid Response from Tooltip Provider', data)
					data = {}
				}

				for (const type of Object.keys(types)) {
					const typeCache = languageCache[type] = languageCache[type] || {}
					const typeData = data[type]
					if (Array.isArray(typeData)) {
						for (const entry of typeData) {
							const id = entry && entry.data && entry.data.id
							const cached = typeCache[id]
							if (cached && !cached.done) {
								cached.done = true
								cached.value = entry
								for (const promise of cached.waiting) {
									promise(entry)
								}
								cached.waiting = null
							}
						}
					} else {
						for (const entry of Object.values(types[type])) {
							const cached = typeCache[entry]
							if (cached && !cached.done) {
								cached.done = true
								cached.value = null
								for (const promise of cached.waiting) {
									promise(null)
								}
								cached.waiting = null
							}
						}
					}
				}
			})
		}
	}

	get(type, id, language) {
		const languageCache = this.cache[language] = this.cache[language] || {}
		const typeCache = languageCache[type] = languageCache[type] || {}
		const cached = typeCache[id]
		if (cached) {
			if (cached.done) {
				return Promise.resolve(cached.value)
			}

			return new Promise(s => cached.waiting.push(s))
		}

		const cache = typeCache[id] = {done: false, waiting: []}

		const languagePending = this.pending[language] = this.pending[language] || {}
		const typePending = languagePending[type] = languagePending[type] || []
		typePending.push(id)

		this.run.cancel()
		this.run()

		return new Promise(s => cache.waiting.push(s))
	}
}

/**
 * Render a link, automatically populated with an icon, name, and rich tooltip
 * with data from XIVDB.
 */
export class DbLink extends PureComponent {
	static defaultProps = {
		useColors: true,
		darkenColors: true,
		showIcon: true,
		showTooltip: true,
	}

	static propTypes = {
		provider: PropTypes.instanceOf(XIVDBTooltipProvider),
		language: PropTypes.string.isRequired,

		type: PropTypes.string.isRequired,
		id: PropTypes.number.isRequired,
		children: PropTypes.node,

		showIcon: PropTypes.bool.isRequired,
		showTooltip: PropTypes.bool.isRequired,
		useColors: PropTypes.bool.isRequired,
		darkenColors: PropTypes.bool.isRequired,
	}

	constructor(props) {
		super(props)

		this.state = {
			provider: this.props.provider || XIVDBTooltipProvider.getInstance(),
			loading: true,
			data: null,
		}

		this.load()
	}

	componentDidUpdate(prevProps) {
		const props = this.props
		if (props.provider !== prevProps.provider ||
				props.language !== prevProps.language ||
				props.type !== prevProps.type ||
				(!isNaN(props.id) && props.id !== prevProps.id)) {
			this.setState({
				loading: true,
			})

			this.load()
		}
	}

	async load() {
		const {type, id, language} = this.props
		const lang = LANGUAGES[language]

		const data = await this.state.provider.get(type, id, lang ? lang.tooltip : language)

		this.setState({
			loading: false,
			data,
		})
	}

	render() {
		const {type, id, children, showTooltip, showIcon, useColors, darkenColors} = this.props
		const {loading, data} = this.state

		if (loading) {
			return <a href={`https://xivdb.com/${type}/${id}`}>
				{showIcon && <Icon loading name="circle notch" />}
				{children || <Trans id="core.dblink.loading">Loading...</Trans>}
			</a>
		}

		const item = data.data
		if (!item.name) {
			return <a href={`https://xivdb.com/${type}/${id}`}>
				{children || <Trans id="core.dblink.not-found">Unable to Load</Trans>}
			</a>
		}

		const color = useColors && item.color
		const colorClass = color && `xivdb-rarity-${color}${darkenColors && '-darken'}`

		const link = <a
			className={`${styles.link} ${colorClass || ''}`}
			href={`https://xivdb.com/${type}/${id}`}
			data-xivdb-key
		>
			{showIcon && <img src={data.data.icon} alt="" />}
			{children || data.data.name}
		</a>

		if (!showTooltip) {
			return link
		}

		return <Popup
			basic
			style={{padding: '0px'}}
			trigger={link}
			content={<div dangerouslySetInnerHTML={{__html: data.html}} />}
		/>
	}
}

const Wrapped = connect(state => ({
	language: state.language.site,
}))(DbLink)

export default Wrapped

// Helpers, because ack is lazy.
export const ActionLink = props => <Wrapped type="action" {...props} />
export const StatusLink = props => <Wrapped
	type="status"
	{...props}
	id={props.id - 1000000}
/>

StatusLink.propTypes = {
	id: PropTypes.number.isRequired,
}
