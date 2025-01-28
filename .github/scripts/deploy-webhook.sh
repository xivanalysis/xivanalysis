#!/usr/bin/env bash
STATUS="$1"
COLOUR="$2"

echo 'Sending Discord Webhook';
BACKTICK='`';
COMPARE_URL="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/compare/$COMPARE"
WORKFLOW_URL="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
COMMIT_FORMATTED="[$BACKTICK${GITHUB_SHA:0:7}$BACKTICK]($COMPARE_URL)";
COMMIT_MESSAGE=$(git log --format=%s -n 1 $GITHUB_SHA);
curl -s -H User-Agent:bot -H Content-Type:application/json -d "{\"embeds\":[{\"author\":{\"name\":\"Build #$GITHUB_RUN_NUMBER ($GITHUB_REF_NAME) $STATUS\",\"url\":\"$WORKFLOW_URL\"},\"url\":\"$COMPARE_URL\",\"color\":$COLOUR,\"description\":\"$COMMIT_FORMATTED - $COMMIT_MESSAGE\"}]}" $DISCORD_WEBHOOK_URL;
