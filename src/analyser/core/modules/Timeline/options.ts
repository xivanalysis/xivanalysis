// We default to showing the first minute of the pull
const ONE_MINUTE = 60000

export const getOptions = (fightDuration: number) => ({
	// General styling
	width: '100%',
	align: 'left',
	stack: false,
	showCurrentTime: false,

	// Date/time formatting
	// moment: (date) => vis.moment(date).utc(),
	maxMinorChars: 4,
	format: {
		minorLabels: {
			minute: 'm[m]',
		},
		majorLabels: {
			second: 'm[m]',
			minute: '',
		},
	},

	// View constraints
	min: 0,
	max: fightDuration,
	zoomMin: 10000,

	// View defaults
	// Show first minute by default, full fight view is a bit hard to grok.
	start: 0,
	end: Math.min(fightDuration, ONE_MINUTE),

	// Zoom key handling
	zoomKey: 'ctrlKey',
	horizontalScroll: true,
} as const)
