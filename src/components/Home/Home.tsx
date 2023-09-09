import {t} from '@lingui/macro'
import {Trans} from '@lingui/react'
import {LinkDiscord, LinkGitHub} from 'components/GlobalSidebar/Links'
import {VersionInfo} from 'components/GlobalSidebar/Version'
import I18nMenu from 'components/ui/I18nMenu'
import TransMarkdown from 'components/ui/TransMarkdown'
import {observer} from 'mobx-react'
import React, {Component} from 'react'
import {Modal} from 'semantic-ui-react'
import styles from './Home.module.css'
import ReportSearch from './ReportSearch'
import SupportSummary from './SupportSummary'

const about = t('core.home.about.content')`
xivanalysis is a tool aimed at helping _you_ improve your performance, through both automatic suggestions and metrics. While some metrics are shared across all jobs - seriously, don't die - most are tailored specifically to each job to ensure they are as accurate and useful as possible.

To do all this, we process data in the form of fight logs, taken from [FF Logs](https://www.fflogs.com/). If you're not already using FF Logs, there are instructions on setting it and ACT (the program that reads data from the game itself) up [here](https://github.com/FFXIV-ACT/setup-guide#readme) and [here](https://www.fflogs.com/client/download).

Just paste your log URL in, and check it out!

If you have any questions, suggestions, or would just like to have a chat - drop by our discord server, linked in the sidebar.
`

@observer
class Home extends Component {
	override render() {
		return <>
			<div className={styles.background}/>

			<div className={styles.logo}>
				<img
					src={process.env.PUBLIC_URL + '/logo.png'}
					alt="logo"
				/>
					xivanalysis
			</div>

			<div className={styles.search}>
				<ReportSearch />

				<Modal trigger={(
					<span className={styles.about}>
						<Trans id="core.home.about.link">What is this?</Trans>
					</span>
				)}>
					<Modal.Header><Trans id="core.home.about.title">
							About xivanalysis
					</Trans></Modal.Header>
					<Modal.Content>
						<TransMarkdown source={about}/>
					</Modal.Content>
				</Modal>

				<div className={styles.support} >
					<SupportSummary />
				</div>
			</div>

			<div className={styles.options}>
				<div className={styles.i18nMenu}><I18nMenu/></div>

				<div>
					<LinkDiscord/>
					<LinkGitHub/>
					<VersionInfo/>
				</div>
			</div>
		</>
	}
}

export default Home
