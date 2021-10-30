# BuffWindow Interface

The plumbing behind BuffWindows is split into Windows and Evaluators.  Windows are responsible for building the windows of actions and combining the output of the evaluators into what shows up on the page.  Evaluators are responsible for examining windows, making Suggestions, and creating a table column for output.  We'll get into more detail on each of these, but for now, let's look at the new interface.

Here's the BuffWindow interface:

```typescript
/**
 * Tracks actions that occur while a buff status is active on the player.
 */
export abstract class BuffWindow extends ActionWindow {

	/**
	 * Implementing modules MUST define the STATUS object for the status that represents the buff window.
	 */
	abstract buffStatus: Status | Status[]

	/**
	 * Determines if a window ended early due to the end of the pull.
	 * @param window The window to check
	 * @returns True if the window is shorter than the expected duration of the buff because of the end
	 * of the pull; false otherwise.
	 */
	protected isRushedEndOfPullWindow(window: HistoryEntry<EvaluatedAction[]>) { /* .. */ }

    // Very important, you must call super.initialise() in any implementing module.
	override initialise() { /* .. */ }
}
```

You'll notice that BuffWindow has a base class of ActionWindow.  This is the base class used for windows with other boundary conditions, but it does have a few methods that you need to know about.

```typescript
/**
 * Tracks actions that occur within a window.
 * By default, all actions cast during a window will be included.
 */
export abstract class ActionWindow extends Analyser {

	/**
	 * Implementing modules MAY provide a value to override the "Rotation" title in the header of the rotation section
	 * If implementing, you MUST provide a JSX.Element <Trans> or <Fragment> tag (Trans tag preferred)
	 */
	protected rotationTableHeader?: JSX.Element

	/**
	 * Adds an evaluator to be run on the windows.
	 * @param evaluator An evaluator to be run on the windows
	 */
	protected addEvaluator(evaluator: WindowEvaluator) { /* .. */ }

	/**
	 * Starts a new window if one is not already open.
	 * @param timestamp The timestamp at which the new window starts.
	 */
	protected onWindowStart(timestamp: number) { /* .. */ }
	/**
	 * Ends an existing window if one is open.
	 * @param timestamp The timestamp at which the window ends.
	 */
	protected onWindowEnd(timestamp: number) { /* .. */ }
	/**
	 * Adds an action to the current window if one is open.
	 * If no window is open, the event is ignored.
	 * Implementing moudles MUST call removeDefaultActionHook before calling this method directly.
	 * @param event The event to be added to the window.
	 */
	protected onWindowAction(event: Events['action']) { /* .. */ }

	/**
	 * Removes the default event hook that captures all actions by the player.
	 * Implementing modules should call this method if they have logic to only
	 * include some actions in a window.
	 * Implmenting modules MUST register their own hook that calls onWindowAction
	 * after calling this method.
	 */
	protected removeDefaultActionHook() { /* .. */ }
	/**
	 * Adjusts the default event hook to ignore certain actions.
	 * Implementing modules MAY call this method if all casts of certain
	 * actions should be ignored in a window.
	 * If actions are only ignored in some conditions, this method is
	 * not suitable, and you will need to register your own hook and callback
	 * that only calls onWindowAction when the conditions are met.
	 * Calling this method will override previous calls to trackOnlyActions.
	 * @param actionsToIgnore The ids of the actions to ignore.
	 */
	protected ignoreActions(actionsToIgnore: number[]) { /* .. */ }
	/**
	 * Adjusts the default event hook to only track certain actions.
	 * Implementing modules MAY call this method if only some actions should
	 * be tracked in a window.
	 * If other actions should be tracked in some conditions, this method is
	 * not suitable, and you will need to register your own hook and callback
	 * that only calls onWindowAction when the conditions are met.
	 * Calling this method will override previous calls to ignoreActions.
	 * @param actionsToTrack The ids of the actions to track.
	 */
	protected trackOnlyActions(actionsToTrack: number[]) { /* .. */ }

    // Very important, you must call super.initialise() in any implementing module.
	override initialise() { /* .. */ }

}
```

One more override property has snuck in here, the override for the header of the RotationTable in the output.

The most important function here is `addEvaluator`.  There are a variety of pre-built WindowEvaluators that cover the common evaluations.  Implementing modules will need to call `addEvaulator` for each evaluation they want to perform in their `initialise` method.

If you do not which to track all actions within a window, you may replace the default event hook in a few ways.  ActionWindow provides `ignoreActions` and `trackOnlyActions` to cover the common cases.  If you have other logic that is not covered by these cases, call `removeDefaultActionHook` and add your own event hook that calls `onWindowAction` for only the casts you want to track.

I'll talk more about other possible windows beyond just buff windows after I go over evaluators.

# Evaluators
The pre-built evaluators cover the most common evaluations.  All you need to do is create a new instance of them and pass them to `addEvaluator`.

## Expected GCDs
ExpectedGcdCountEvaluator checks if a window contains the maximum possible number of GCDs, not counting fast GCDs like in Hypercharge.  The constructor options class for this evaluator is:

```typescript
interface ExpectedGcdCountOptions {
	expectedGcds: number
	/**
	 * This should be the globalCooldown dependency object.
	 * It is used by this class to perform end of fight gcd count adjustment.
	 */
	globalCooldown: GlobalCooldown
	suggestionIcon: string
	suggestionContent: JSX.Element
	windowName: string
	severityTiers: SeverityTiers
	/**
	 * This method MAY be provided to adjust the default number of expected GCDs, as calculated based on
	 * the provided baseline and window duration.
	 * This method is NOT responsible for calculating reductions due to end of fight rushing.
	 * @param window The window for which the expected GCD count will be adjusted
	 * @returns An adjustment to add to the baseline expected GCD count. A positive number INCREASES the
	 * number of expected GCDs; a negative number DECREASES the number of expected GCDs
	 */
	adjustCount? : (window: HistoryEntry<EvaluatedAction[]>) => number
}
```

ExpectedGcdCountEvaluator will reduce the number of expected gcds for buffs used near the end of the fight or buffs used right before a death.  The `adjustCount` function is only responsible for other adjustments.
 
## Allowed GCDs Only
AllowedGcdsOnlyEvaluator checks if all GCDs in a window are one of the allowed GCDs.  The constructor options class for this evaluator is:

```typescript
interface AllowedGcdsOnlyOptions {
	expectedGcdCount: number
	allowedGcds: number[]
	/**
	 * This should be the globalCooldown dependency object.
	 * It is used by this class to perform end of fight gcd count adjustment.
	 */
	globalCooldown: GlobalCooldown
	suggestionIcon: string
	suggestionContent: JSX.Element
	windowName: string
	severityTiers: SeverityTiers
	/**
	 * This method MAY be provided to adjust the default number of expected GCDs, as calculated based on
	 * the provided baseline and window duration.
	 * This method is NOT responsible for calculating reductions due to end of fight rushing.
	 * @param window The window for which the expected GCD count will be adjusted
	 * @returns An adjustment to add to the baseline expected GCD count. A positive number INCREASES the
	 * number of expected GCDs; a negative number DECREASES the number of expected GCDs
	 */
	adjustCount? : (window: HistoryEntry<EvaluatedAction[]>) => number
}
```

AllowedGcdsOnlyEvaluator will reduce the number of expected gcds for buffs used near the end of the fight or buffs used right before a death.  The `adjustCount` function is only responsible for other adjustments.

## Expected Actions
ExpectedActionsEvaluator checks if a set of actions were used at least a minimum number of times per window.  These actions can be any mix of GCD or oGCD actions.  The constructor options class for this evaluator is:

```typescript
export interface TrackedActionsOptions {
	expectedActions: TrackedAction[]
	suggestionIcon: string
	suggestionContent: JSX.Element
	windowName: string
	severityTiers: SeverityTiers
	/**
	 * This method MAY be provided to adjust the expected number of uses of a tracked action within a given window.
	 * This method IS responsible for calculating ALL reductions INCLUDING due to end of fight rushing.
	 * @param window The window for which the expected tracked action count will be adjusted
	 * @param action The action whose count will be adjusted
	 * @returns An adjustment to add to the expected count. A positive number INCREASES the
	 * number of expected uses; a negative number DECREASES the number of expected uses.
	 */
	adjustCount? : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => number
	/**
	 * This method MAY be provided to adjust the highlighting outcome of an evaluation for a tracked action within a given window.
	 * @param buffWindow The window for which the tracked action outcome will be adjusted
	 * @param action The action whose outcome will be adjusted
	 * @returns A function that takes actual and expected uses and return the adjusted RotationTargetOutcome or
	 * undefined to use the default logic for this window and action combination.
	 */
	adjustOutcome? : (window: HistoryEntry<EvaluatedAction[]>, action: TrackedAction) => OutcomeCalculator | undefined
}
```

Unlike ExpectedGcdCountEvaluator, there is no reduction for end of fight or death by default in this evaluator.  You will need to provide a method to `adjustCount` if you wish to have these reductions.

## Limited Actions
LimitedActionsEvaluator checks if a set of actions were used no more than a maximum number of times per window.  The constructor options class is the same as for ExpectedActionsEvaluator.  As with ExpectedActionsEvaluator, no reduction for end of fight or death is applied by default.

## Notes
Unlike the other evaluators, NotesEvaluator is actually a base class for implementors that want to provide notes at the end of the table.  You will need to created a derived class and pass an instance of that evaluator to addEvaluator.  The interface for NotesEvaluator is:

```typescript
export abstract class NotesEvaluator {

    protected abstract header : RotationTarget
    protected abstract generateNotes(window: HistoryEntry<TimestampedAction[]>): JSX.Element

}
```
    
If your window needs multiple notes columns, you may create multiple NotesEvaluator classes and pass them to addEvaluator.

## Custom Evaluators
If you want to add an evaluation that will give out x/y style results that is not covered by one of the above evaluators, you can derive from the base WindowEvaluator class and pass an instance of that class to addEvaluator in the window.

If you find that another job has already done a similar evaluation, consider pulling that evaluator out into a separate file in the common directories that can then be used by both jobs and any future jobs that need such an evaluation.

# Non-buff Windows
The ActionWindow system is designed to allow windows to be started and stopped in a variety of ways.  The `onWindowStart` and `onWindowEnd` methods give you ultimate flexibility to define a window in whatever way you want, but there are two additional windows implementations being considered for inclusion in the initial pull request.  All window implementations will keep the Evaluator system from ActionWindow.  If you want some sort of window tracking but don't want the ActionWindow evaluator suggestions and output system, consider using the History class instead.

The first implementation is TimedWindow, which is intended for things like Hypercharge that have an action that triggers the start of the window but do not apply a status that can be tracked to indicate the end of the window.  Its interface looks like this:

```typescript
/**
 * Tracks actions that occur for a time period after an action was used by the player.
 * This should be used for actions that start a window but do not apply a status, such as Hypercharge
 */
export abstract class TimedWindow extends ActionWindow {

	/**
	 * Implementing modules MUST define the ACTION object that starts a window.
	 */
	abstract startAction: Action | Action[]
	/**
	 * Implementing modules MUST define the duration of a window in milliseconds
	 * from the time startAction is cast.
	 */
	abstract duration: number

    // Very important, you must call super.initialise() in any implementing module.
	override initialise() { /* .. */ } 
}
```

The second implementation is called RestartWindow.  This window is for situations where a window starts with the cast of a skill and continues until the next cast of that same skill, such as Aetherflow on SCH or Energy Drain/Siphon on SMN.  Users of this window are strongly recommended to override the default action hook to capture only the relevant data for each window.  Its interface looks like this:

```typescript
/**
 * Tracks actions that occur between casts of an action by the player.
 * This should be used for actions that start a window that lasts until the next cast
 * of the skill, such as Aetherflow windows.
 */
export abstract class RestartWindow extends ActionWindow {

	/**
	 * Implementing modules MUST define the ACTION object that ends a previous window and starts new one.
	 */
	abstract startAction: Action | Action[]

    // Very important, you must call super.initialise() in any implementing module.
	override initialise() { /* .. */ }
}
```
