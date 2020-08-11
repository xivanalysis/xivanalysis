# Internationalisation (i18n)

This project makes use of [jsLingui](https://github.com/lingui/js-lingui) with a dash of custom logic to make dynamic content a bit easier. It's recommended to familiaise yourself with [its available components](https://lingui.js.org/ref/react.html#components) to help implementation.

All text displayed to the end-user should be passed through this translation layer. See below for a few examples.

## i18n IDs

All translated strings should be given an explicit ID, to help keep things consistent. This project formats i18n IDs using the syntax: `[job].[module].[thing]`

As an example, for a Red Mage you might end up with the key `rdm.gauge.white-mana`. These
keys should be somewhat descriptive to make it clear for translators what exactly they're editing.

## Examples

### Module titles

If your module has `output`, it should also be given a translated title. This title will be shown above its output, as well as used for the link in the sidebar.

```javascript
import {t} from '@lingui/macro'
import Module from 'parser/core/Module'

export default class MyModule extends Module {
	// ...
	static title = t('my-job.my-module.title')`My Module`
	// ...
}
```

### JSX content

In most cases, you can skip the peculiar syntax shown above, and use the `Trans` JSX tag, which automates a _lot_ of the hard yards for you. This is commonly seen in use in module output and suggestions, among other things. There's a number of other utility tags besides `Trans`, such as `Plural` - see [the lingui documentation](https://lingui.js.org/ref/react.html#components) for more info.

```jsx
import {Trans, Plural} from '@lingui/react'
import ACTIONS from 'data/ACTIONS'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

const supportedLanguages = 6
this.suggestions.add(new Suggestion({
	icon: ACTIONS.RAISE.icon,
	severity: SEVERITY.MORBID,
	content: <Trans id="my-job.my-module.suggestions.my-suggestion.content">
		You should <strong>really</strong> use localization.
	</Trans>,
	why: <Trans id="my-job.my-module.suggestions.my-suggestion.why">
		Localisation is important, we support
		<Plural
			value={supportedLanguages}
			one="# language"
			other="# languages"
		/>
	</Trans>,
}))
```

### Markdown

Sometimes, you _really_ gotta put a lot of content in - it's cases like this that markdown comes in handy. We use a slightly extended syntax based on [CommonMark](https://commonmark.org/).

Key differences:

* `[~action/ACTION_KEY]` will automatically turn into an `ActionLink` with icon, tooltip, and similar.
* `[~status/STATUS_KEY]` will likewise automatically turn into a `StatusLink`.
* Don't use code blocks (`` `...` ``). Just... don't. Please. It breaks everything.

```jsx
import {t} from '@lingui/macro'
import TransMarkdown from 'components/ui/TransMarkdown'

const description = t('your-job.about.description')`
This is an _example_ of using **markdown** in conjunction with the TransMarkdown component.

I am also [contractually](https://some-url.com/) obliged to remind you to [~action/RUIN_III] everything.
`
const rendered = <TransMarkdown source={description}/>
```
