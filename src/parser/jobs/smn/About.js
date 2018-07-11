import React from "react"

import CONTRIBUTORS from "data/CONTRIBUTORS"
import CoreAbout from "parser/core/modules/About"

export default class About extends CoreAbout {
	description = <

	p>

	This

	isn&

	apos;

	t

	even

	remotely

	done.</
	p>

	supportedPatch = "4.35"

	contributors = [
		{ user: CONTRIBUTORS.ACKWELL, role: "Maintainer" },
		{ user: CONTRIBUTORS.NEMEKH, role: "Theorycraft" },
		{ user: CONTRIBUTORS.FRYTE, role: "Theorycraft" },
	]
}
