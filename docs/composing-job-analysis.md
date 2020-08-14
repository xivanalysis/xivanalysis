# Composing job analysis

This document aims to provide an outline for composing the various tools available into a consistent experience. Where possible, this document will avoid delving into the implementation details - instead focusing on the broad strokes, in the hope it may also prove helpful for translators and the like.

## Overview of the module structure

The final "analysis" presented to a user is composed of the results from multiple smaller modules, arranged vertically down the page. These modules are what's listed in the sidebar for navigation, and can be seen as discrete blocks (in most cases) in the main content of the page.

In general, modules are more detailed/in-depth the further down the page they are positioned. The page starts off with an introduction in the About module, and moves down through suggestions to job-specific analysis data, followed by the full timeline of the fight.

The core analysis package provides a number of shared modules for displaying data in pre-defined manner, detailed below.

## About

The about module is always positioned at the top of the page, and provides a brief introduction to the job, and the analysis of the job. It displays the content defined in the job's meta file.

This content will be the same for every user, and shouldn't contain any "analysis" per se. It is, however, an excellent spot to provide links to guides and other documents that may be useful to the user.

Aim to be informative here. There's nothing wrong with a good pun or several, but make sure it's not the _focus_ of the description.

## Checklist

Situated directly after About, the Checklist module is the first thing users will see that pertains to the actual analysed log itself. On small screens, it may also be the only analysis that's visible without scrolling - so it's important to get right to the point.

Checklist is designed to be a _brief_ overview of a few core things that are utterly vital to performing well on the job - things that, were you checking someone's logs yourself, would be the big things you'd look for before really digging in. Did you keep your GCD rolling? Did you use any of your personal buffs and oGCDs? Did you keep your DoTs up?

Checklist requirements are _always_ displayed - collapsed by default if they've been met, and expanded with further info visible if they were not. If the metric you're analysing is something that warrants multiple "levels" of issue, or is a nitpick/situational issue, consider using a Suggestion instead.

Like other modules of its ilk, Checklist entries should be written to be informative. Don't tell the user what they did wrong, tell them how they could do better.

## Suggestions

Following on after Checklist, the Suggestions module presents a more flexible means of displaying suggestions on how to improve gameplay, based on the analysis performed. Unlike Checklist, Suggestions will dynamically display only the suggestions that have been "tripped" for the analysis at hand - and as such, is better suited to more nitty-gritty analysis, as well as checks that are uncommon or unsuited for a checklist-style display.

Suggestions contain two text fields; the "content", and the "why":

- The "content" field should be used to describe the suggestion with a relative amount of detail. It informs the user how to better their play.
- The "why" field should act as an extension of the content, _briefly_ outlining the collected data from the analysis that led to this suggestion being displayed.

**Important:** When writing suggestions, remember that they're _suggestions_ on how to improve. Don't tell the user off for making a mistake - suggest to them how to mitigate that mistake, instead.
{: .admonition .caution}

Suggestions also contain a "severity", which is used both to prioritise which suggestions rise to the top, as well as help guide the user towards what needs fixing. The available severities are:

- **Morbid:** Included here _purely_ for completion's sake. Don't use it. This suggestion severity is reserved for the "Don't die" suggestion, and is reserved such that that suggestion is always at the top of the list.
- **Major:** Displayed at the top of the list (unless the user died). Major suggestions should be reserved for significant rotational problems that would actively _and_ drastically impact the user's ability to perform well.
- **Medium:** Displayed under Major suggestions, and are the lowest level displayed by default. Medium should be used for rotational mistakes that would definitely have impacted performance, but are less drastic - and hence shouldn't be prioritised over major issues.
- **Minor:** The lowest severity, only displayed if toggled on in the suggestion view. Minor suggestions are best used for nitpicks and rotational mistakes that might've been a fat-finger. The sort of stuff that's worth flagging, but not important to fix when there might be more serious stuff to address.

## Statistics

Statistics are a bit different to other modules - although composed by the single "Statistics" module, each statistic is displayed as it's own mini-module, with a number of modules filling in space across the page as fits the screen size.

While Checklist and Suggestions are about presenting the user ways to improve, Statistics (and most of the content below it) is when the analysis results starts getting into the real "analysis" bit, displaying information about what _happened_, rather than what the user _should do_.

As such, being the "gateway" to the analysis, statistics should provide - akin the the checklist - an at-a-glance overview of a few important metrics that were calculated. By default, the GCD estimate calculated by core is included here, but you can add many of your own. Consider displaying some statistics about job-specific mechanics such as stances, pets, or gauges here!

Given how they are configured and displayed, aim to always provide content for a statistic, rather than conditionally display one. They're there to provide information, and a lack of information is information in and of itself!

## Timeline

Primarily controlled by core modules, the timeline is used to display what happened during the analysed fight in a visual fashion. Out of the box, it displays raid buffs, the GCD, and cooldowns used by the user.

It may be worthwhile considering if there is something you're analysing that could be included in the timeline. Visual representations can help many people better understand the statistics and analysis provided.

Also consider using the tools available to link down _to_ the timeline from other modules - it can help contextualise the content by providing the visual representation of what you're talking about.

## Changelog

Akin to the About module, the Changelog shouldn't contain any analysis results. It's situated permanently beneath all other content on the page, and should display a list of changes that have been made to both core, and the job being analysed.

If you're making changes to anything in the parser, make sure you include a changelog entry outlining the changes you've made!
