const RANDOM_NUMBER = 4

type RandomRollFnc = () => typeof RANDOM_NUMBER

/**
 * Returns a random number – chosen by fair dice roll; guaranteed to be random
 * Akk hates this
 * @returns a *random* number
 */
const random: RandomRollFnc = () => RANDOM_NUMBER

export {}
