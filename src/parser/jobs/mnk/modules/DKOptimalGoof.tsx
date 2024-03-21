import { Analyser } from "parser/core/Analyser"
import {Trans} from '@lingui/react'
import { dependency } from "parser/core/Injectable"
import {filter} from 'parser/core/filter'
import { Actors } from "parser/core/modules/Actors"
import { Data } from "parser/core/modules/Data"
import { Timeline } from "parser/core/modules/Timeline"
import { Events } from "event"
import Checklist, { Requirement, Rule } from "parser/core/modules/Checklist"
import Suggestions, {SEVERITY, TieredSuggestion} from 'parser/core/modules/Suggestions'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import { ActionLink, DataLink } from "components/ui/DbLink"
import { Button, Table } from "semantic-ui-react"
import { Action } from "data/ACTIONS"
import styles from 'components/ui/Rotation.module.css'


interface GCD {
	timestamp: number
    action: Action
	dfTimer?: number
    reason?: string
}
interface Disciplined {
	start: number
    }
export class DKOptimalGoof extends Analyser {
	static override handle = 'DKOptimal'


	@dependency private checklist!: Checklist
	@dependency private suggestions!: Suggestions

	@dependency private data!: Data
	@dependency private timeline!: Timeline
	@dependency private actors!: Actors

	private readonly blitz = [
		this.data.actions.CELESTIAL_REVOLUTION.id,
		this.data.actions.ELIXIR_FIELD.id,
		this.data.actions.RISING_PHOENIX.id,
		this.data.actions.PHANTOM_RUSH.id,
    ]

    private dragonKicks: GCD[] = []
    private missedKicks: GCD[] = []
    private allNonPBGCDs: number = 0
    private disciplineFist?: Disciplined
    private twinRefreshExpected?: number
 
    override initialise(): void {
        const playerFilter = filter<Event>().source(this.parser.actor.id)

        this.addEventHook(playerFilter.type('action'),this.onCast)
        this.addEventHook(playerFilter.type('statusApply').status(this.data.statuses.DISCIPLINED_FIST.id), this.onGain)
		this.addEventHook(playerFilter.type('statusRemove').status(this.data.statuses.DISCIPLINED_FIST.id), this.onDrop)
    
		this.addEventHook('complete', this.onComplete)
    }

    private onCast(event: Events['action']) {
		const action = this.data.getAction(event.action)

        const inPB = this.actors.current.hasStatus(this.data.statuses.PERFECT_BALANCE.id)
		if (action == null || !(action.onGcd ?? false) || inPB ) { return }
        

		const gcd: GCD = {
			timestamp: event.timestamp,
            action: action
		}

        const isDragonKick = action.id === this.data.actions.DRAGON_KICK.id 
        const isBlitz = this.blitz.includes(action.id) 
        const inDisciplinedFist = this.actors.current.hasStatus(this.data.statuses.DISCIPLINED_FIST.id)
        let needTwinRefresh
        if(this.twinRefreshExpected){
            needTwinRefresh = this.twinRefreshExpected - event.timestamp < 2500
			gcd.dfTimer = this.twinRefreshExpected  - event.timestamp 
		}
            

        if(this.actors.current.hasStatus(this.data.statuses.LEADEN_FIST.id) && (
            this.actors.current.hasStatus(this.data.statuses.OPO_OPO_FORM.id) 
                || this.actors.current.hasStatus(this.data.statuses.FORMLESS_FIST.id))){
            return
        }

        if(!inDisciplinedFist || this.actors.current.hasStatus(this.data.statuses.COEURL_FORM.id)) return


        if(!needTwinRefresh){
            if(isDragonKick){
                this.dragonKicks.push(gcd)
            }else if (!isBlitz) {
                gcd.reason = `Not a dragon kick :(`
                this.missedKicks.push(gcd)
            }
			
			this.allNonPBGCDs++
    
        }
    }

    onComplete() {
        this.checklist.add(new Rule({
			name: <Trans id="mnk.dragonkickrotation.checklist.name">Dragon Kick to win</Trans>,
			description: <Trans id="mnk.dragonkickrotation.checklist.description">
				<DataLink action="DRAGON_KICK"/> is your strongest GCD if you want to win, press it.
			</Trans>,
			displayOrder: DISPLAY_ORDER.DK_OPTIMAL_GOOF,
			requirements: [
				new Requirement({
					name: <Trans id="mnk.dragonkickrotation.checklist.requirement.name">Optimal <DataLink action="DRAGON_KICK"/>  </Trans>,
					percent: () => this.dragonKicks.length/this.allNonPBGCDs * 100,
				}),
			],
			target: 95,
		}))
    }

	private onGain(event: Events['statusApply']): void {
		// Check if existing window or not
		if (!this.disciplineFist) {
			this.disciplineFist = {start: event.timestamp}
		}
		this.twinRefreshExpected = event.timestamp + 15000
        
	}

	private onDrop(event: Events['statusRemove']): void {
		this.disciplineFist = undefined
        this.twinRefreshExpected = undefined
	}

    override output(): React.ReactNode {
		if (this.missedKicks.length <= 0) {
			return false
		}

		const data = this.missedKicks.sort((a, b) => a.timestamp - b.timestamp)

		return <Table compact unstackable celled textAlign="center">
			<Table.Header>
				<Table.Row>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.dkmiss-table.header.starttime">Time</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.dkmiss-table.header.dftimer">Discipline Fist Status</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell>
						<strong><Trans id="core.ui.dkmiss-table.header.comboactions">Action</Trans></strong>
					</Table.HeaderCell>
					<Table.HeaderCell collapsing>
						<strong><Trans id="core.ui.dkmiss-table.header.reason">Reason</Trans></strong>
					</Table.HeaderCell>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{
					data.map((issue, index) => {

                        const action = issue.action
        
						return <Table.Row key={issue.timestamp}>
							<Table.Cell style={{whiteSpace: 'nowrap'}}>
								{issue.timestamp > 0 &&
									<>
										<span>{this.parser.formatEpochTimestamp(issue.timestamp, 0)}</span>
										<Button style={{marginLeft: 5}}
											circular
											compact
											size="mini"
											icon="time"
											onClick={() => this.timeline.show(this.relativeTimestamp(issue.timestamp), this.relativeTimestamp( issue.timestamp))}
										/>
									</>}
							</Table.Cell>
							<Table.Cell>
								{ issue.dfTimer && 
									<>
										<span>{this.parser.formatDuration(issue.dfTimer, 2)}</span>
									</>
								}
							</Table.Cell>
							<Table.Cell>
                                <div
                                    key={index}
                                >
                                    <ActionLink
                                        showName={false}
                                        iconSize={styles.gcdSize}
                                        {...action}
                                    />
                                </div>
							</Table.Cell>
							<Table.Cell>
								<span style={{whiteSpace: 'nowrap'}}>{issue.reason}</span>
							</Table.Cell>
						</Table.Row>
					})
				}
			</Table.Body>
		</Table>
	}
    private relativeTimestamp(timestamp: number) {
		return timestamp - this.parser.pull.timestamp
	}
}