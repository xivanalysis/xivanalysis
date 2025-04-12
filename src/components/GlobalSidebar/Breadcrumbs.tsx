import {ReactNode, createContext, useContext, useState, useEffect, useMemo, Dispatch, SetStateAction} from 'react'
import {Helmet} from 'react-helmet'
import {matchPath, useLocation, Link, useResolvedPath} from 'react-router-dom'
import style from './Breadcrumbs.module.css'

interface BreadcrumbValue {
	title: string
	subtitle?: ReactNode
	url?: string
}
type BreadcrumbRegistry = Record<string, BreadcrumbValue>
interface BreadcrumbContextValue {
	registry: BreadcrumbRegistry
	setRegistry: Dispatch<SetStateAction<BreadcrumbRegistry>>
	banner: string | undefined
	setBanner: Dispatch<SetStateAction<string | undefined>>
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
			const segments: Array<BreadcrumbValue & {url: string}> = []

			while (true) {
				path += '/:segment'
				url = matchPath({path: path + '/*'}, pathname)?.pathnameBase
				if (url == null || escapeHatch > 100) { break }
				const crumb = registry?.[url]
				if (crumb != null) { segments.push({...crumb, url: crumb.url ?? url}) }
				escapeHatch++
			}
			return segments
		},
		[pathname, registry],
	)

	return <>
		<Helmet>
			<title>
				{segments.length > 0 ? `${segments[segments.length - 1].title} | ` : ''}
				xivanalysis
			</title>
		</Helmet>

		{segments.length > 0 && (
			<div className={style.container}>
				{banner && (
					<div
						className={style.background}
						style={{backgroundImage: `url(${banner})`}}
					/>
				)}

				{segments.map(({url, title, subtitle}) => (
					<Link
						key={url}
						to={url}
						className={style.link}
					>
						{title}
						{subtitle && <>
							&nbsp;<span className={style.subtitle}>{subtitle}</span>
						</>}
					</Link>
				))}
			</div>
		)}
	</>
}

export function Breadcrumb(crumb: BreadcrumbValue) {
	const {setRegistry} = useContext(BreadcrumbContext) ?? {}
	const {pathname} = useResolvedPath('..')

	useEffect(
		() => {
			if (setRegistry == null) { return }

			setRegistry(registry => ({...registry, [pathname]: crumb}))

			return () => setRegistry(registry => {
				const newRegistry = {...registry}
				delete newRegistry[pathname]
				return newRegistry
			})
		},
		[setRegistry, pathname, crumb],
	)

	return null
}

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
