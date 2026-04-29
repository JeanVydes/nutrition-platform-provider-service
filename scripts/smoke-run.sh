#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
SECURITY_BASE_URL="${SECURITY_BASE_URL:-https://mriai.coreunimag.com/api/auth}"

if [[ -z "${ACCESS_TOKEN:-}" ]]; then
  echo "[smoke] ACCESS_TOKEN is required (real security token)"
  exit 1
fi

AUTH_HEADER="Authorization: Bearer ${ACCESS_TOKEN}"
CONTENT_HEADER="Content-Type: application/json"

gen_uuid() {
  node -e "console.log(require('crypto').randomUUID())"
}

extract_json_field() {
  local field="$1"
  node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync(0,'utf8'));console.log(data['$field'] ?? '');"
}

wait_for_health() {
  echo "[smoke] Waiting for ${BASE_URL}/health ..."
  for i in {1..40}; do
    if curl -fsS "${BASE_URL}/health" >/dev/null 2>&1; then
      echo "[smoke] Service is healthy"
      return 0
    fi
    sleep 2
  done
  echo "[smoke] Service did not become healthy in time"
  return 1
}

post_json() {
  local url="$1"
  local body="$2"
  local response
  response=$(curl -fsS -X POST "${url}" -H "${CONTENT_HEADER}" -H "${AUTH_HEADER}" -d "${body}")
  echo "${response}"
}

wait_for_health

PROVIDER_ACCOUNT_ID="$(gen_uuid)"
SCHOOL_ID="$(gen_uuid)"

echo "[smoke] Fetching user id from security /me ..."
me_response=$(curl -fsS -H "${AUTH_HEADER}" "${SECURITY_BASE_URL}/me")
WORKER_ACCOUNT_ID=$(printf '%s' "${me_response}" | node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync(0,'utf8'));console.log(data?.datos?.id ?? data?.datos?.idUsuario ?? data?.idUsuario ?? '');")

if [[ -z "${WORKER_ACCOUNT_ID}" ]]; then
  echo "[smoke] Failed to resolve user id from /me"
  echo "${me_response}"
  exit 1
fi

echo "[smoke] Creating provider ..."
provider_response=$(post_json "${BASE_URL}/providers" "{\"accountId\":\"${PROVIDER_ACCOUNT_ID}\",\"name\":\"Smoke Provider\",\"companyRegistration\":\"NIT-SMOKE-001\",\"contactEmail\":\"smoke@provider.test\",\"contactPhone\":\"+573001112233\"}")
PROVIDER_ID="$(printf '%s' "${provider_response}" | extract_json_field id)"

if [[ -z "${PROVIDER_ID}" ]]; then
  echo "[smoke] Failed to parse provider id"
  echo "${provider_response}"
  exit 1
fi

echo "[smoke] Creating cafeteria ..."
cafeteria_response=$(post_json "${BASE_URL}/cafeterias" "{\"schoolId\":\"${SCHOOL_ID}\",\"providerId\":\"${PROVIDER_ID}\",\"name\":\"Cafeteria Smoke\"}")
CAFETERIA_ID="$(printf '%s' "${cafeteria_response}" | extract_json_field id)"

if [[ -z "${CAFETERIA_ID}" ]]; then
  echo "[smoke] Failed to parse cafeteria id"
  echo "${cafeteria_response}"
  exit 1
fi

echo "[smoke] Creating worker ..."
worker_response=$(post_json "${BASE_URL}/workers" "{\"accountId\":\"${WORKER_ACCOUNT_ID}\",\"providerId\":\"${PROVIDER_ID}\",\"position\":\"Operario\",\"contractType\":\"fijo\",\"hireDate\":\"2026-01-15\",\"salary\":\"1500000.00\"}")
WORKER_ID="$(printf '%s' "${worker_response}" | extract_json_field id)"

if [[ -z "${WORKER_ID}" ]]; then
  echo "[smoke] Failed to parse worker id"
  echo "${worker_response}"
  exit 1
fi

echo "[smoke] Assigning worker ..."
assignment_response=$(post_json "${BASE_URL}/workers/assignments" "{\"workerId\":\"${WORKER_ID}\",\"cafeteriaId\":\"${CAFETERIA_ID}\",\"role\":\"Turno Manana\",\"startDate\":\"2026-02-01\"}")
ASSIGNMENT_ID="$(printf '%s' "${assignment_response}" | extract_json_field id)"

if [[ -z "${ASSIGNMENT_ID}" ]]; then
  echo "[smoke] Failed to parse assignment id"
  echo "${assignment_response}"
  exit 1
fi

echo "[smoke] SUCCESS"
echo "[smoke] PROVIDER_ID=${PROVIDER_ID}"
echo "[smoke] CAFETERIA_ID=${CAFETERIA_ID}"
echo "[smoke] WORKER_ID=${WORKER_ID}"
echo "[smoke] ASSIGNMENT_ID=${ASSIGNMENT_ID}"
