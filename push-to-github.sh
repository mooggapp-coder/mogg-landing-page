#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="https://github.com/mooggapp-coder/mogg-landing-page.git"

if ! command -v git >/dev/null 2>&1; then
  echo "Git is not installed or not available in PATH."
  exit 1
fi

if [ ! -d .git ]; then
  echo "No Git repository found. Initializing a new repository..."
  git init
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  if git show-ref --verify --quiet refs/heads/main; then
    echo "Switching to existing 'main' branch..."
    git checkout main
  else
    echo "Creating and switching to 'main' branch..."
    git checkout -b main
  fi
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

read -rp "Commit message: " COMMIT_MESSAGE
if [ -z "$COMMIT_MESSAGE" ]; then
  echo "Commit message cannot be empty. Aborting."
  exit 1
fi

git add -A

git commit -m "$COMMIT_MESSAGE" || echo "No changes to commit."

echo "Pushing branch 'main' to origin..."
git push origin main

echo "Done. If this is the first push, make sure your GitHub credentials are configured locally."
