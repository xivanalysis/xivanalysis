import {Trans} from '@lingui/react/macro'
import {DataLink} from 'components/ui/DbLink'
import {Events} from 'event'
import {dependency} from 'parser/core/Injectable'
import {Swiftcast as CoreSwiftcast} from 'parser/core/modules/Swiftcast'
import {Icon, Message} from 'semantic-ui-react'
import {DISPLAY_ORDER} from './DISPLAY_ORDER'
import {Gauge} from './Gauge'
import {InstantCastUsageEvaluator} from './InstantCastEvaluators/InstantCastUsageEvaluator'

export class Swiftcast extends CoreSwiftcast {
	static override displayOrder: number = DISPLAY_ORDER.SWIFTCAST

	protected override showGoodUseColumn = false

	@dependency private gauge!: Gauge

	protected override prependMessages?: JSX.Element | undefined = <Message icon>
		<Icon name="info" />
		<Message.Content>
			<Trans id="blm.swiftcast.header.message">
				<DataLink action="SWIFTCAST" /> should primarily be used for a damage increase making <DataLink showIcon={false} action="BLIZZARD_III" /> instant after switching into Umbral Ice with <DataLink showIcon={false} action="TRANSPOSE" />.<br/>
				You may use it for movement if necessary, but you should try to resolve shorter movements by slidecasting or using actions like <DataLink showIcon={false} action="XENOGLOSSY" /> that are already instant.
			</Trans>
		</Message.Content>
	</Message>

	override initialise(): void {
		super.initialise()

		if (!this.parser.patch.before('7.2')) {
			this.addEvaluator(new InstantCastUsageEvaluator({
				blizzard3Id: this.data.actions.BLIZZARD_III.id,
				gauge: this.gauge,
			}))
		}
	}

	// Stupid shim to work around an ACT/fflogs event ordering glitch where Thunderhead applications due to AF/UI element changes
	// cause the Swiftcast status remove event to come before the action event, which is opposite the normal ordering
	protected override onStatusRemove(event: Events['statusRemove']): void {
		this.addTimestampHook(event.timestamp + 1, () => super.onStatusRemove(event))
	}
}
