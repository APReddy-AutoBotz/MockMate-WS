@echo off
echo === CURRENT BRANCH ===
git.exe rev-parse --abbrev-ref HEAD
echo.
echo === GIT STATUS ===
git.exe status
echo.
echo === STAGED FILES ===
git.exe diff --cached --name-only
echo.
echo === UNSTAGED FILES ===
git.exe diff --name-only
echo.
echo === UNTRACKED FILES ===
git.exe ls-files --others --exclude-standard
