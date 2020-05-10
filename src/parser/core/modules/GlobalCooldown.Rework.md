Planned GCD module update:
- [x] Rewrite to TS with tests
- [ ] Remove speedmod and replace with requiring implementing classes specify their own speed adjustment (either via property or protected function)
- [ ] Ignore casts where downtime is detected between casts when computing the histogram
- [ ] Estimate GCD by lumping the normalized intervals into .05s wide buckets (2.41-2.45, 2.46-2.50, 2.51-2.55, etc), then picking the bucket with the highest observed count, then picking the .01s estimate within that bucket that had the highest count.  Clamp to 2.50.

Post implementation stretch goals:
- [ ] Allow implementing classes to specify an icon to display for their speed status and have the statistics box display GCD under that status (with MNK my thought is the icon would probably be GL4 and we would only display the 4 stack estimated GCD)
- [ ] Add a suggestion if a percentage (initial threshold thoughts: 20%?  allow implementing classes to specify/override the default?) of the histogram is lumped into the 2.55+ buckets
