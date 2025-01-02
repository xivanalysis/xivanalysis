#!/usr/bin/env bash
echo "Checking if message extract is up to date...";
yarn extract;

if [[ $(git diff --stat locale) != '' ]]; then
	echo "Extract diff found.";
	DIFF=$(git diff --color=never locale)
	OUTPUT="<?xml version=\"1.0\" encoding=\"utf-8\"?>
	<testsuites>
		<testsuite package=\"xiva.extract\" time=\"0\" tests=\"1\" errors=\"1\" name=\"i18n message extraction\" >
			<testcase time=\"0\" name=\"xiva.extract.failure\">
				<failure message=\"Changes to locale files detected. Please run \`yarn extract\` and commit the changes to ensure translations remain in sync.\"><![CDATA[$DIFF]]></failure>
			</testcase>
		</testsuite>
	</testsuites>
	";

	mkdir -p reports/extract;
	echo "$OUTPUT" > reports/extract/results.xml;
	exit 1;
fi;
