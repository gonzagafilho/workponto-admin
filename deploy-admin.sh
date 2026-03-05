#!/usr/bin/env bash
set -euo pipefail

echo "==> WorkPonto Admin deploy (build + restart)"
cd "$(dirname "$0")"

echo "==> npm install"
npm install

echo "==> build"
npm run build

echo "==> restart pm2"
pm2 restart workponto-admin

echo "==> health check"
curl -I http://127.0.0.1:3210 | head -n 5
echo "OK ✅"
