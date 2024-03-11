# Uploading example logs

Job maintainers are encouraged to include links to example logs when adding or modifying job analysis modules, in order to help reviewers confirm that the module is working as expected and in order to help future maintainers confirm that modules are still working correctly after architectural changes or other updates.  Example logs that are created using striking dummies or other non-ranked content can be uploaded to the xivanalysis "static"/guild on FFLogs for better visibility and archival.

## Creating good examples

Example logs should contain the actions / rotations necessary to generate appropriate suggestions or checklist output for one or two specific modules "under test".  While it's possible to create one mega example log to cover most or all analysis modules for a single job, creating smaller & more focused examples is better to simplify using those examples to test modules and to make it easier to replace those logs when the analysis gets updated.

Example logs can be created against any striking dummy **of level 80 or above** that is also not a higher level than the character/job being used to create the log.  Stone, Sky, Sea is an ideal place for short examples, or you can find housing or open world dummies with sufficient health that they take more than 5 minutes for you to kill (starting with the level 80 dummies in Stormblood, the housing & open world dummies now have substantially higher health pools that should work for creating example logs).

## Uploading logs to FFLogs

Example logs can be uploaded to the [xivanalysis logs static](https://www.fflogs.com/guild/id/123584) for better visibility and archival.  After applying to the static, request for a `@Codebase Maintainer` on Discord to get you set up to be able to upload logs.  Once you've been configured for uploads, you can choose the "xivanalysis logs" static from within your FFLogs uploader to upload the example logs as either Public or Unlisted (Private logs cannot be read from the API for analysis).  Please note that only example logs should be uploaded to this static, as any logs for ranked content will likely not rank due to the configuration of the static.

## Referencing example logs in modules

Once an example log has been created and uploaded to FFLogs, add a link to that log as a comment in the module file(s) the log is for.  All example log comment links should be at the top of the module file, immediately under the list of includes, along with any comments other contributors should be aware of when using that log to review the module.
