import {Analyser} from "parser/core/Analyser"
import {ReactNode} from "react"

export interface AlwaysBeCastingIssueInfo {
	timestamp: number,
	delay: number,
	start: number,
	stop: number,
	actionsContent: ReactNode,
	infoContent?: ReactNode,
}

export abstract class AlwaysBeCastingAnalyser extends Analyser {
	public abstract getDelayPerIssue(issue: TODO): number
	public abstract getTotalDelay(): number
	public abstract getIssueData(): AlwaysBeCastingIssueInfo[]
	public abstract get hasIssues(): boolean
}
