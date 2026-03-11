#!/bin/bash
# Posts a message to Discord via webhook.
# Usage: ./scripts/discord-notify.sh "message"
# Requires DISCORD_WEBHOOK_URL environment variable.
# Silently no-ops if the variable is unset.

[ -z "$DISCORD_WEBHOOK_URL" ] && exit 0

# Escape special JSON characters in the message
message=$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

curl -s -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{\"content\": $message}" > /dev/null
