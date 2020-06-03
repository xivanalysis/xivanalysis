import React, {ReactNode, createContext, useContext, useState, useEffect, useMemo} from 'react'
import {useRouteMatch, matchPath, useLocation, Link} from 'react-router-dom'
import {Helmet} from 'react-helmet'

interface BreadcrumbValue {
	title: string
	subtitle?: ReactNode
}
type BreadcrumbRegistry = Record<string, BreadcrumbValue>
interface BreadcrumbContextValue {
	registry: BreadcrumbRegistry
	setRegistry: React.Dispatch<React.SetStateAction<BreadcrumbRegistry>>
	banner: string | undefined
	setBanner: React.Dispatch<React.SetStateAction<string | undefined>>
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | undefined>(undefined)

interface BreadcrumbsProps {
	children?: ReactNode
}

export function BreadcrumbProvider({children}: BreadcrumbsProps) {
	const [registry, setRegistry] = useState<BreadcrumbRegistry>({})
	const [banner, setBanner] = useState<string>()

	const contextValue = useMemo(
		() => ({registry, setRegistry, banner, setBanner}),
		[registry, setRegistry, banner, setBanner],
	)

	return (
		<BreadcrumbContext.Provider value={contextValue}>
			{children}
		</BreadcrumbContext.Provider>
	)
}

export function Breadcrumbs() {
	const {registry, banner} = useContext(BreadcrumbContext) ?? {}

	const {pathname} = useLocation()
	const segments = useMemo(
		() => {
			let path = ''
			let url: string | undefined
			let escapeHatch = 0
			const segments: Array<{url: string, crumb: BreadcrumbValue}> = []
			while (true) {
				path += '/:segment'
				url = matchPath(pathname, {path})?.url
				if (url == null || escapeHatch > 100) { break }
				const crumb = registry?.[url]
				if (crumb != null) { segments.push({url, crumb}) }
				escapeHatch++
			}
			return segments
		},
		[pathname, registry],
	)

	return <>
		<Helmet>
			<title>
				{segments.length > 0 ? `${segments[segments.length - 1].crumb.title} | ` : ''}
				xivanalysis
			</title>
		</Helmet>

		<ul>
			<li>Banner: {banner}</li>
			{segments.map(({url, crumb}, index) => (
				<li key={index}>
					<Link to={url}>
						{crumb.title}
						{crumb.subtitle && <>&nbsp;<small>{crumb.subtitle}</small></>}
					</Link>
				</li>
			))}
		</ul>
	</>
}

export function Breadcrumb({title, subtitle}: BreadcrumbValue) {
	const {setRegistry} = useContext(BreadcrumbContext) ?? {}
	const {url} = useRouteMatch()

	useEffect(
		() => {
			if (setRegistry == null) { return }

			setRegistry(registry => ({...registry, [url]: {title, subtitle}}))

			return () => setRegistry(registry => {
				const newRegistry = {...registry}
				delete newRegistry[url]
				return newRegistry
			})
		},
		[setRegistry, url, title, subtitle],
	)

	return null
}

// Should this just be a hook?
export function BreadcrumbsBanner({banner}: {banner?: string}) {
	const {setBanner} = useContext(BreadcrumbContext) ?? {}

	useEffect(
		() => {
			setBanner?.(banner)
			return () => setBanner?.(undefined)
		},
		[setBanner, banner],
	)

	return null
}
