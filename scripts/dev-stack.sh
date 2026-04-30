#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${ROOT_DIR}/../.venv/bin/python"
AI_PORT="8000"
UI_PORT="8080"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "Python virtual environment not found at ${PYTHON_BIN}" >&2
  echo "Configure the venv before starting the full stack." >&2
  exit 1
fi

free_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Clearing port ${port}: ${pids}"
    local normalized_pids
    normalized_pids="$(echo "${pids}" | tr '\n' ' ')"
    kill ${normalized_pids} 2>/dev/null || true
    pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "${pids}" ]]; then
      normalized_pids="$(echo "${pids}" | tr '\n' ' ')"
      kill -9 ${normalized_pids} 2>/dev/null || true
    fi
  fi
}

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  free_port "${AI_PORT}"
  free_port "${UI_PORT}"
  if [[ -n "${UI_PID:-}" ]]; then
    kill "${UI_PID}" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

cd "${ROOT_DIR}"

free_port "${AI_PORT}"
free_port "${UI_PORT}"

echo "Starting AI backend on http://127.0.0.1:${AI_PORT}"
"${PYTHON_BIN}" -m uvicorn backend_service.app:app --host 127.0.0.1 --port "${AI_PORT}" &
AI_PID=$!

echo "Starting UI on http://127.0.0.1:${UI_PORT}"
npm run dev -- --host 127.0.0.1 --port "${UI_PORT}" --strictPort