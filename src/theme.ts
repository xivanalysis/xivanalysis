import Color from 'color'
import styles from 'theme.module.css'

// Helpers
function extractNumber(value: string): number {
	const stripped = value.replace(/[^0-9]/g, '')
	return parseInt(stripped, 10)
}

// Sizing
export const gutter = extractNumber(styles.gutter)

// Breakpoints
export const sm = extractNumber(styles.sm)
export const md = extractNumber(styles.md)
export const lg = extractNumber(styles.lg)
export const xl = extractNumber(styles.xl)

// Colours
export const themeBlack = Color(styles.themeBlack)
export const themeLight = Color(styles.themeLight)
export const themeWhite = Color(styles.themeWhite)
