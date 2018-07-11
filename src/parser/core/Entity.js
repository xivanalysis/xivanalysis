export default class Entity {
	parser = null

	buffs = []

	// TODO: Should this have defaults?
	// TODO: Should I track this over time?
	resources = {}

	constructor(parser) {
		this.parser = parser;
	}

	/**
	 * @param {number} statusId status ID to check for
	 * @param {number} forTimestamp Timestamp (in ms) to be considered, or the current timestamp if null. Won't work right for timestamps after the currentTimestamp.
	 * @param {number} bufferTime Time (in ms) after buff's expiration where it will still be included. There's a bug in the combat log where if a spell consumes a buff that buff may disappear a short time before the heal or damage event it's buffing is logged. This can sometimes go up to hundreds of milliseconds.
	 * @param {number} minimalActiveTime - Time (in ms) the buff must have been active before timestamp for it to be included.
	 * @param {number} sourceID - source ID the buff must have come from, or any source if null
	 * @returns {boolean} - Whether the buff is present with the given specifications.
	 */
	hasStatus(statusId, forTimestamp = null, bufferTime = 0, minimalActiveTime = 0, sourceID = null) {
		return this.getStatus(statusId, forTimestamp, bufferTime, minimalActiveTime, sourceID) !== undefined;
	}

	/**
	 * @param {number} statusId - status ID to check for
	 * @param {number} forTimestamp Timestamp (in ms) to be considered, or the current timestamp if null. Won't work right for timestamps after the currentTimestamp.
	 * @param {number} bufferTime Time (in ms) after buff's expiration where it will still be included. There's a bug in the combat log where if a spell consumes a buff that buff may disappear a short time before the heal or damage event it's buffing is logged. This can sometimes go up to hundreds of milliseconds.
	 * @param {number} minimalActiveTime - Time (in ms) the buff must have been active before timestamp for it to be included.
	 * @param {number} sourceID - source ID the buff must have come from, or any source if null.
	 * @returns {Object} - A buff with the given specifications. The buff object will have all the properties of the associated applybuff event, along with a start timestamp, an end timestamp if the buff has fallen, and an isDebuff flag. If multiple buffs meet the specifications, there's no guarantee which you'll get (this could happen if multiple spells with the same statusId but from different sources are on the same target)
	 */
	getStatus(statusId, forTimestamp = null, bufferTime = 0, minimalActiveTime = 0, sourceID = null) {
		const currentTimestamp = forTimestamp || this.parser.currentTimestamp;
		return this.buffs.find(buff =>
			buff.ability.guid === Number(statusId) &&
			(currentTimestamp - minimalActiveTime) >= buff.start &&
			(buff.end === null || (buff.end + bufferTime) >= currentTimestamp) &&
			(sourceID === null || sourceID === buff.sourceID));
	}
}
