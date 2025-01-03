#!/usr/bin/env bash
echo 'Sending Discord Webhook';
export BACKTICK='`';
export COMPARE_URL="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/compare/$COMPARE"
export WORKFLOW_URL="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
export COMMIT_FORMATTED="[$BACKTICK${GITHUB_SHA:0:7}$BACKTICK]($COMPARE_URL)";
export COMMIT_MESSAGE=$(git log --format=%s -n 1 $GITHUB_SHA);
curl -v -H User-Agent:bot -H Content-Type:application/json -d "{\"embeds\":[{\"author\":{\"name\":\"Build #$GITHUB_RUN_NUMBER ($GITHUB_REF_NAME) Failed\",\"url\":\"$WORKFLOW_URL\"},\"url\":\"$COMPARE_URL\",\"color\":13700128,\"description\":\"$COMMIT_FORMATTED - $COMMIT_MESSAGE\"}]}" $DISCORD_WEBHOOK_URL;
