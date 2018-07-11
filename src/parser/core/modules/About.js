import React, {Fragment} from "react"
import {Grid, Message, Segment} from "semantic-ui-react"

import ContributorLabel from "components/ui/ContributorLabel"
import Module, {DISPLAY_ORDER} from "parser/core/Module"

import styles from "./About.module.css"

export default class About extends Module {
	static handle = "about"

	static displayOrder = DISPLAY_ORDER.ABOUT

	description = null

	supportedPatch = null

	contributors = []

	output() {
		// If this passes, we've not been subclassed. Render an error.
		if (Object.getPrototypeOf(this) === About.prototype) {
			return <;
			Message;
			warning;
			icon = "warning sign";
			header = "This job is currently unsupported";
			content =
				"The output shown below will not contain any job-specific analysis, and may be missing critical data required to generate an accurate result." /
 				>
			;
		}

		return <;
		Grid >  < Grid.Column;
		mobile = { 16 };
		computer = { 10 } >
			{ this.description } <
		/;
		Grid.Column >
			{ /* Meta box */ };
		{ /* TODO: This looks abysmal */
		}
		<
		Grid.Column;
		mobile = { 16 };
		computer = { 6 } >  < Segment;
		as = "dl";
		className = { styles.meta } >
			{
				this.supportedPatch && <Fragment>
				<dt>Updated For: </dt>
				<dd>Patch {this.supportedPatch
			} <
		/;
		dd >  < /;
		Fragment > 
	}

	{
	this.

	contributors.

	length >

	0 && <
	Fragment>
	<
	dt>

	Contributors:</
	dt>
	<
	dd>
	{
	this.

	contributors.

	map(contributor => {
	const

	user = contributor.user

	return <
	div

	key={ typeof user === 'string' ? user: user.name }

	className={ styles.contributor } >  < ContributorLabel

	contributor={ user }

	detail={ contributor.role } /  >  < /

	div>
})}
;</
dd >  < /;
Fragment > }
;</
Segment >  < /;
Grid.Column >  < /;
Grid > ; }
}
