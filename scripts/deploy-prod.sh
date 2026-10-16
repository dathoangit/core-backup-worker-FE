#!/bin/sh
# Deploy the backup worker UI on xp-cntt-server.
# Run from core-backup-worker-FE after copying .env.production.example to .env.production.
set -eu

ENV_FILE=.env.production

fail() {
  echo "deploy-prod: $1" >&2
  exit 1
}

docker compose version >/dev/null 2>&1 || fail "docker compose is not available"

[ -f "$ENV_FILE" ] || fail "$ENV_FILE is missing (copy .env.production.example and set NEXT_PUBLIC_API_URL)"

API_URL=$(grep -E '^NEXT_PUBLIC_API_URL=' "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d '[:space:]' || true)
[ -n "$API_URL" ] || fail "NEXT_PUBLIC_API_URL is empty in $ENV_FILE"

case "$API_URL" in
  *localhost*|*127.0.0.1*|*api-test.becen.org*)
    fail "NEXT_PUBLIC_API_URL must be the server LAN address (found '$API_URL')"
    ;;
esac

HOST_PORT=$(grep -E '^HOST_PORT=' "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d '[:space:]' || true)
HOST_PORT=${HOST_PORT:-3001}

echo "Building image with NEXT_PUBLIC_API_URL=$API_URL"
docker compose --env-file "$ENV_FILE" build

echo "Starting container"
docker compose --env-file "$ENV_FILE" up -d --remove-orphans

docker compose --env-file "$ENV_FILE" ps

echo "Waiting for http://127.0.0.1:$HOST_PORT/"
ATTEMPT=0
until curl -fsS "http://127.0.0.1:$HOST_PORT/" >/dev/null; do
  ATTEMPT=$((ATTEMPT + 1))
  [ "$ATTEMPT" -ge 30 ] && fail "UI did not answer on / within 60s; check 'docker compose logs'"
  sleep 2
done

echo "UI is up at http://127.0.0.1:$HOST_PORT/"
