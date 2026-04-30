#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DEFAULT_CHROME_BIN="$REPO_ROOT/tools/chrome-for-testing/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
CHROME_BIN="${CHROME_BIN:-$DEFAULT_CHROME_BIN}"
PROFILE_DIR="${PROFILE_DIR:-/tmp/super-tab-out-chrome-profile}"
REMOTE_DEBUGGING_PORT="${REMOTE_DEBUGGING_PORT:-9224}"
EXTENSION_DIR="$REPO_ROOT/extension"
SEED_TABS="${SEED_TABS:-1}"
SEED_DELAY_MS="${SEED_DELAY_MS:-900}"
SEED_CLEANUP="${SEED_CLEANUP:-1}"
SEED_REQUIRED="${SEED_REQUIRED:-0}"
SEED_SCRIPT="$SCRIPT_DIR/seed-chrome-test-data.mjs"
EXTRA_URLS=()

usage() {
  cat <<EOF
Usage: scripts/launch-chrome-testing.sh [options] [-- extra-url ...]

Launch Chrome for Testing with the local Super Tab Out extension.

Options:
  --seed-tabs           Open a full Super Tab Out test scenario (default).
  --no-seed-tabs        Launch only the extension, without creating test tabs.
  --reset-profile       Delete the test profile before launch for a clean run.
  --profile-dir DIR     Use a custom Chrome profile dir.
  --port PORT           Remote debugging port. Default: $REMOTE_DEBUGGING_PORT
  --chrome-bin PATH     Chrome for Testing executable.
  -h, --help            Show this help.

Environment overrides:
  CHROME_BIN, PROFILE_DIR, REMOTE_DEBUGGING_PORT, SEED_TABS,
  SEED_DELAY_MS, SEED_CLEANUP, SEED_REQUIRED

Examples:
  scripts/launch-chrome-testing.sh
  scripts/launch-chrome-testing.sh --reset-profile
  scripts/launch-chrome-testing.sh --no-seed-tabs
  CHROME_BIN="/path/to/Google Chrome for Testing" scripts/launch-chrome-testing.sh
EOF
}

RESET_PROFILE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed-tabs)
      SEED_TABS=1
      shift
      ;;
    --no-seed-tabs)
      SEED_TABS=0
      shift
      ;;
    --reset-profile)
      RESET_PROFILE=1
      shift
      ;;
    --profile-dir)
      PROFILE_DIR="${2:?Missing value for --profile-dir}"
      shift 2
      ;;
    --port)
      REMOTE_DEBUGGING_PORT="${2:?Missing value for --port}"
      shift 2
      ;;
    --chrome-bin)
      CHROME_BIN="${2:?Missing value for --chrome-bin}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      EXTRA_URLS+=("$@")
      break
      ;;
    *)
      EXTRA_URLS+=("$1")
      shift
      ;;
  esac
done

if [[ ! -x "$CHROME_BIN" ]]; then
  cat >&2 <<EOF
Chrome for Testing was not found or is not executable:
  $CHROME_BIN

Install it under tools/chrome-for-testing/ or run with:
  CHROME_BIN="/path/to/Google Chrome for Testing" $0
EOF
  exit 1
fi

if [[ ! -d "$EXTENSION_DIR" ]]; then
  echo "Extension directory does not exist: $EXTENSION_DIR" >&2
  exit 1
fi

if [[ "$RESET_PROFILE" == "1" ]]; then
  if [[ -z "$PROFILE_DIR" || "$PROFILE_DIR" == "/" || "$PROFILE_DIR" != *super-tab-out* ]]; then
    echo "Refusing to reset suspicious profile dir: $PROFILE_DIR" >&2
    echo "Use a profile path containing 'super-tab-out' for --reset-profile." >&2
    exit 1
  fi
  rm -rf -- "$PROFILE_DIR"
fi

LOAD_EXTENSIONS="$EXTENSION_DIR"

echo "Chrome binary: $CHROME_BIN"
echo "Profile dir:   $PROFILE_DIR"
echo "Extension:     $EXTENSION_DIR"
if [[ "$SEED_TABS" == "1" ]]; then
  if [[ ! -f "$SEED_SCRIPT" ]]; then
    echo "Seed script does not exist: $SEED_SCRIPT" >&2
    exit 1
  fi
  echo "Seed script:   $SEED_SCRIPT"
  echo "Scenario:      tabs, groups, duplicates, saved items, sessions, tool state"
else
  echo "Scenario:      disabled"
fi
echo "Debug port:    $REMOTE_DEBUGGING_PORT"

CHROME_ARGS=(
  "--user-data-dir=$PROFILE_DIR"
  "--remote-debugging-port=$REMOTE_DEBUGGING_PORT"
  "--remote-allow-origins=*"
  "--load-extension=$LOAD_EXTENSIONS"
  "--disable-extensions-except=$LOAD_EXTENSIONS"
  "--disable-background-networking"
  "--disable-component-update"
  "--disable-default-apps"
  "--disable-sync"
  "--metrics-recording-only"
  "--no-first-run"
  "--no-default-browser-check"
)

if [[ ${#EXTRA_URLS[@]} -gt 0 ]]; then
  CHROME_ARGS+=("${EXTRA_URLS[@]}")
fi

CHROME_PID=""

stop_chrome() {
  if [[ -n "$CHROME_PID" ]] && kill -0 "$CHROME_PID" 2>/dev/null; then
    kill "$CHROME_PID" 2>/dev/null || true
    wait "$CHROME_PID" 2>/dev/null || true
  fi
}

trap 'stop_chrome; exit 130' INT
trap 'stop_chrome; exit 143' TERM

"$CHROME_BIN" "${CHROME_ARGS[@]}" &
CHROME_PID=$!

if [[ "$SEED_TABS" == "1" ]]; then
  if ! node "$SEED_SCRIPT" \
    --port "$REMOTE_DEBUGGING_PORT" \
    --delay-ms "$SEED_DELAY_MS" \
    --cleanup "$SEED_CLEANUP"; then
    echo "Warning: failed to prepare Super Tab Out test scenario." >&2
    if [[ "$SEED_REQUIRED" == "1" ]]; then
      stop_chrome
      exit 1
    fi
  fi
fi

set +e
wait "$CHROME_PID"
CHROME_STATUS=$?
set -e

trap - INT TERM
exit "$CHROME_STATUS"
