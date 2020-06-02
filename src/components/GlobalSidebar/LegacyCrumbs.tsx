import {useParams} from 'react-router-dom'
import React, {useContext, ReactNode} from 'react'
import {StoreContext} from 'store'
import {observer} from 'mobx-react'
import {languageToEdition, getPatch, GameEdition} from 'data/PATCHES'
import {Icon} from 'semantic-ui-react'
import {getCorrectedFight} from 'data/BOSSES'
import {formatDuration} from 'utilities'

const editionName = {
	[GameEdition.GLOBAL]: <Icon name="globe"/>,
	[GameEdition.KOREAN]: 'KR',
	[GameEdition.CHINESE]: 'CN',
}

function useLoadedReport(code: string) {
	const {reportStore: {report}} = useContext(StoreContext)

	return report?.loading === false && report.code === code
		? report
		: undefined
}

export const ReportCrumb = observer(function ReportCrumb() {
	const {code} = useParams<{code: string}>()
	const report = useLoadedReport(code)

	let title = code
	let subtitle: ReactNode

	if (report != null) {
		title = report.title

		const edition = languageToEdition(report.lang)
		const patch = getPatch(edition, report.start / 1000)
		subtitle = <>({editionName[edition]} {patch})</>
	}

	return <CrumbItem title={title} subtitle={subtitle}/>
})

export const FightCrumb = observer(function FightCrumb() {
	const {code, fight} = useParams<{code: string, fight: string}>()
	const report = useLoadedReport(code)

	let title = fight
	let subtitle: string | undefined

	const fightId = parseInt(fight, 10)
	const fightData = report?.fights.find(fight => fight.id === fightId)
	if (fightData != null) {
		const correctedFight = getCorrectedFight(fightData)
		const {start_time, end_time} = correctedFight

		title = correctedFight.name
		subtitle = `(${formatDuration(end_time - start_time)})`
	}

	return <CrumbItem title={title} subtitle={subtitle}/>
})

export const CombatantCrumb = observer(function ObserverCrumb() {
	const {code, combatant} = useParams<{code: string, combatant: string}>()
	const report = useLoadedReport(code)

	const combatantId = parseInt(combatant, 10)
	const combatantData = report?.friendlies.find(friendly => friendly.id === combatantId)
	const title = combatantData?.name ?? combatant

	return <CrumbItem title={title}/>
})

const CrumbItem = ({title, subtitle}: {title: ReactNode, subtitle?: ReactNode}) => <>
	{title}
	{subtitle && <>&nbsp;<small>{subtitle}</small></>}
</>
