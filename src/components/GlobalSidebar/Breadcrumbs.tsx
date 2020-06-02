import React, {ReactNode, createContext, useContext, useState, useEffect, useMemo} from 'react'
import {useRouteMatch, matchPath, Route, useLocation, Link} from 'react-router-dom'

type BreadcrumbRegistry = Record<string, ReactNode>
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
			const segments: Array<{url: string, node: ReactNode}> = []
			while (true) {
				path += '/:segment'
				url = matchPath(pathname, {path})?.url
				if (url == null || escapeHatch > 100) { break }
				const node = registry?.[url]
				if (node != null) { segments.push({url, node}) }
				escapeHatch++
			}
			return segments
		},
		[pathname, registry],
	)

	return (
		<ul>
			<li>Banner: {banner}</li>
			{segments.map((segment, index) => (
				<li key={index}>
					<Link to={segment.url}>
						{segment.node}
					</Link>
				</li>
			))}
		</ul>
	)
}

export interface BreadcrumbProps {
	path: string
	children?: ReactNode
}

export function Breadcrumb({path, children}: BreadcrumbProps) {
	const {setRegistry} = useContext(BreadcrumbContext) ?? {}
	const match = useRouteMatch(path)
	const url = match?.url

	const crumb = useMemo(
		() => <Route path={path}>{children}</Route>,
		[path, children],
	)

	useEffect(
		() => {
			if (url == null || setRegistry == null) { return }

			setRegistry(registry => ({...registry, [url]: crumb}))

			return () => setRegistry(registry => {
				const newRegistry = {...registry}
				delete newRegistry[url]
				return newRegistry
			})
		},
		[setRegistry, url, crumb],
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
