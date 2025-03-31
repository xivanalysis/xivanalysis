# Internationalisation (i18n)

This project makes use of [jsLingui](https://github.com/lingui/js-lingui) with a dash of custom logic to make dynamic content a bit easier. It's recommended to familiaise yourself with [its available components](https://lingui.js.org/ref/react.html#components) to help implementation.

All text displayed to the end-user should be passed through this translation layer. See below for a few examples.

## i18n IDs

All translated strings should be given an explicit ID, to help keep things consistent. This project formats i18n IDs using the syntax: `[job].[module].[thing]`

As an example, for a Red Mage you might end up with the key `rdm.gauge.white-mana`. These
keys should be somewhat descriptive to make it clear for translators what exactly they're editing.

## Examples

### Analyser titles

If your module has `output`, it should also be given a translated title. This title will be shown above its output, as well as used for the link in the sidebar.

```typescript
import {msg} from '@lingui/core/macro'
import {Analyser} from 'parser/core/Analyser'

export class MyModule extends Analyser {
	// ...
	static title = msg({id: 'my-job.my-module.title', message: 'My Module'})
	// ...
}
```

### JSX content

In most cases, you can skip the peculiar syntax shown above, and use the `Trans` JSX tag, which automates a _lot_ of the hard yards for you. This is commonly seen in use in module output and suggestions, among other things. There's a number of other utility tags besides `Trans`, such as `Plural` - see [the lingui documentation](https://lingui.js.org/ref/react.html#components) for more info.

```tsx
import {Trans, Plural} from '@lingui/react/macro'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

// ...

const supportedLanguages = 6
this.suggestions.add(new Suggestion({
	icon: this.data.actions.RAISE.icon,
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

Don't use code blocks (`` `...` ``). Just... don't. Please. It breaks everything.

```jsx
import {msg} from '@lingui/core/macro'
import {TransMarkdown} from 'components/ui/TransMarkdown'

const description = msg({id: 'your-job.about.description', message: `
This is an _example_ of using **markdown** in conjunction with the TransMarkdown component.

I am also [contractually](https://some-url.com/) obliged to remind you to Ruin III everything.
`})
const rendered = <TransMarkdown source={description}/>
```
