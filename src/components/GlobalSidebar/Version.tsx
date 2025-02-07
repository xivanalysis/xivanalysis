import {Popup} from 'semantic-ui-react'
import styles from './Version.module.css'

// Version info
const version = process.env.REACT_APP_VERSION || 'DEV'
const gitCommit = process.env.REACT_APP_GIT_COMMIT || 'DEV'
const gitBranch = process.env.REACT_APP_GIT_BRANCH || 'DEV'

export const VersionInfo = () => (
	<Popup
		trigger={<span className={styles.version}>#{version}</span>}
		position="bottom center"
	>
		<Popup.Content>
			<dl className={styles.versionInfo}>
				<dt>Commit</dt>
				<dd>{gitCommit}</dd>
				<dt>Branch</dt>
				<dd>{gitBranch}</dd>
			</dl>
		</Popup.Content>
	</Popup>
)
