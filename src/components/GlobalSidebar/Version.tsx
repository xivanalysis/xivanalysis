import {XIVA_VERSION, XIVA_GIT_COMMIT, XIVA_GIT_BRANCH} from 'env'
import {Popup} from 'semantic-ui-react'
import styles from './Version.module.css'

export const VersionInfo = () => (
	<Popup
		trigger={<span className={styles.version}>#{XIVA_VERSION}</span>}
		position="bottom center"
	>
		<Popup.Content>
			<dl className={styles.versionInfo}>
				<dt>Commit</dt>
				<dd>{XIVA_GIT_COMMIT}</dd>
				<dt>Branch</dt>
				<dd>{XIVA_GIT_BRANCH}</dd>
			</dl>
		</Popup.Content>
	</Popup>
)
