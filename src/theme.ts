import Color from 'color'
import styles from 'theme.module.css'

// Helpers
function extractNumber(value: string): number {
	if (process.env.NODE_ENV === 'test') { return 0 }
	const stripped = value.replace(/[^0-9]/g, '')
	return parseInt(stripped, 10)
}

function extractColor(value: string): Color {
	if (process.env.NODE_ENV === 'test') { return Color('black') }
	return Color(value)
}

// Sizing
export const gutter = extractNumber(styles.gutter)

// Breakpoints
export const sm = extractNumber(styles.sm)
export const md = extractNumber(styles.md)
export const lg = extractNumber(styles.lg)
export const xl = extractNumber(styles.xl)

// Colours
export const themeBlack = extractColor(styles.themeBlack)
export const themeLight = extractColor(styles.themeLight)
export const themeWhite = extractColor(styles.themeWhite)
