#!/usr/bin/env bash
# Preflight check for the Convex + Clerk + Vercel PWA stack.
# Usage: bash preflight.sh [project-dir]
# Verifies local tooling and access to every external service the stack
# needs, printing a fix hint for each failing check. Exits non-zero if
# anything required is missing. Safe to run in an empty directory (it then
# only checks tooling + account logins, skipping project-level checks).

set -u
PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR" 2>/dev/null || { echo "No such directory: $PROJECT_DIR"; exit 2; }

PASS=0
FAIL=0
WARN=0

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31m✗\033[0m %s\n      fix: %s\n' "$1" "$2"; FAIL=$((FAIL+1)); }
warn() { printf '  \033[33m~\033[0m %s\n      note: %s\n' "$1" "$2"; WARN=$((WARN+1)); }

env_has() {
  # env_has VAR_NAME — true if .env.local defines VAR_NAME with a value
  [ -f .env.local ] && grep -Eq "^${1}=.+" .env.local
}

echo "== Tooling =="
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -ge 20 ]; then
    ok "node $(node -v)"
  else
    bad "node $(node -v) is too old" "install Node 20+ (e.g. via nvm: nvm install 20)"
  fi
else
  bad "node not found" "install Node 20+ from https://nodejs.org or via nvm"
fi
command -v pnpm >/dev/null 2>&1 && ok "pnpm $(pnpm -v)" || bad "pnpm not found" "npm install -g pnpm"
command -v git  >/dev/null 2>&1 && ok "git $(git --version | awk '{print $3}')" || bad "git not found" "install Xcode command line tools / git"

IS_PROJECT=false
[ -f package.json ] && IS_PROJECT=true

echo
echo "== Convex =="
if [ -f "$HOME/.convex/config.json" ]; then
  ok "Convex CLI is logged in (~/.convex/config.json)"
else
  bad "Convex CLI not logged in" "sign up at https://convex.dev then run 'npx convex dev' — it opens the browser login"
fi
if $IS_PROJECT; then
  if env_has CONVEX_DEPLOYMENT; then
    ok "project linked to a Convex deployment (.env.local: CONVEX_DEPLOYMENT)"
  else
    bad "project not linked to Convex" "run 'npx convex dev' once in this directory; it creates the project and writes .env.local"
  fi
  env_has VITE_CONVEX_URL && ok "VITE_CONVEX_URL present in .env.local" \
    || bad "VITE_CONVEX_URL missing from .env.local" "run 'npx convex dev' — it writes the deployment URL"
else
  warn "no package.json here" "project-level Convex checks skipped (run again inside the app directory)"
fi

echo
echo "== Clerk =="
if $IS_PROJECT; then
  if env_has VITE_CLERK_PUBLISHABLE_KEY; then
    ok "VITE_CLERK_PUBLISHABLE_KEY present in .env.local"
  else
    bad "VITE_CLERK_PUBLISHABLE_KEY missing" "create an app at https://dashboard.clerk.com, copy the publishable key (pk_...) into .env.local"
  fi
  # CLERK_JWT_ISSUER_DOMAIN lives in the Convex deployment env, not locally.
  if env_has CONVEX_DEPLOYMENT && command -v node >/dev/null 2>&1; then
    if npx --yes convex env get CLERK_JWT_ISSUER_DOMAIN >/dev/null 2>&1; then
      ok "CLERK_JWT_ISSUER_DOMAIN set on the Convex deployment"
    else
      bad "CLERK_JWT_ISSUER_DOMAIN not set on Convex" "in Clerk: JWT Templates -> New -> Convex, copy the Issuer URL; then 'npx convex env set CLERK_JWT_ISSUER_DOMAIN <url>'"
    fi
  else
    warn "cannot verify CLERK_JWT_ISSUER_DOMAIN" "requires a linked Convex deployment; it must be set in the Convex dashboard env vars"
  fi
else
  warn "no package.json here" "Clerk checks are per-project; run again inside the app directory"
fi

echo
echo "== Vercel =="
if command -v vercel >/dev/null 2>&1; then
  ok "vercel CLI installed ($(vercel --version 2>/dev/null | head -1))"
  if vercel whoami >/dev/null 2>&1; then
    ok "Vercel CLI logged in ($(vercel whoami 2>/dev/null))"
  else
    bad "Vercel CLI not logged in" "sign up at https://vercel.com then run 'vercel login'"
  fi
else
  bad "vercel CLI not installed" "npm install -g vercel, then 'vercel login'"
fi
if $IS_PROJECT; then
  if [ -f .vercel/project.json ]; then
    ok "project linked to Vercel (.vercel/project.json)"
  else
    warn "project not linked to Vercel yet" "run 'vercel link' (or the first 'vercel' deploy) when ready"
  fi
fi

echo
echo "== Web Push (VAPID) =="
if $IS_PROJECT; then
  if env_has VITE_VAPID_PUBLIC_KEY; then
    ok "VITE_VAPID_PUBLIC_KEY present in .env.local"
  else
    bad "VITE_VAPID_PUBLIC_KEY missing" "generate a pair with 'npx web-push generate-vapid-keys'; public key goes in .env.local"
  fi
  if env_has CONVEX_DEPLOYMENT; then
    MISSING_VAPID=""
    for var in VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY VAPID_SUBJECT; do
      npx --yes convex env get "$var" >/dev/null 2>&1 || MISSING_VAPID="$MISSING_VAPID $var"
    done
    if [ -z "$MISSING_VAPID" ]; then
      ok "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT set on Convex"
    else
      bad "missing on Convex deployment:$MISSING_VAPID" "npx convex env set VAPID_PUBLIC_KEY <key> (same for PRIVATE_KEY; SUBJECT is 'mailto:you@example.com')"
    fi
  else
    warn "cannot verify server-side VAPID vars" "they live in the Convex deployment env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT)"
  fi
else
  warn "no package.json here" "VAPID checks are per-project; keys are generated with 'npx web-push generate-vapid-keys'"
fi

echo
echo "== Summary: $PASS ok, $FAIL missing, $WARN skipped/notes =="
[ "$FAIL" -eq 0 ] || exit 1
exit 0
