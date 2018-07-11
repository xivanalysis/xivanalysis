import {addExtraIndex} from "utilities"

import ENEMY from "./ENEMY"
import ROLE from "./ROLE"
import SHARED from "./SHARED"
import SMN from "./SMN"

const STATUSES = {
	...ENEMY,
	...ROLE,
	...SHARED,
	...SMN,
};

// Presumably because WoW statuses and spells share the same ID space, FFLogs adds 1m to every status ID. I'm not gonna get everyone to do that in here, so just automating it.
const correctIdsToMatchLogs = obj => {
	Object.keys(obj).forEach(key => {
		obj[key].id = obj[key].id + 1000000;
	});
	return obj;
};

export default addExtraIndex(correctIdsToMatchLogs(STATUSES), "id")
