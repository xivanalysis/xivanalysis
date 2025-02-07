import {Icon} from 'semantic-ui-react'
import styles from './Links.module.css'

export const LinkDiscord = () => (
	<a
		href="https://discord.gg/jVbVe44"
		target="_blank"
		rel="noopener noreferrer"
		className={styles.icon}
	>
		<Icon name="discord"/>
	</a>
)

export const LinkGitHub = () => (
	<a
		href="https://github.com/xivanalysis/xivanalysis"
		target="_blank"
		rel="noopener noreferrer"
		className={styles.icon}
	>
		<Icon name="github"/>
	</a>
)
