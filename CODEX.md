# CODEX Workflow

## Project Summary

This project is a personal dashboard built with Next.js, React, and Tailwind CSS. It stores user preferences in `localStorage` and exposes utility pages from `pages/utils`.

## Build From Scratch

Use these prompts in order when rebuilding or extending the project with an LLM:

1. "Create a Next.js project using the `pages` router, React 18, and Tailwind CSS. Keep the structure simple and suitable for a personal dashboard."
2. "Add a landing page with a search box, configurable bookmarks, and a background image loaded from browser `localStorage`."
3. "Add a settings page that edits theme, bookmarks, search engine, suggestion provider, search limits, and background image. Persist each setting in `localStorage`."
4. "Add a utilities index page that links to standalone tools under `pages/utils`."
5. "Keep the app client-side only for user preferences. Do not add password managers, secret storage, or security-sensitive credential features."
6. "Use existing dependencies where possible and avoid adding packages unless they are required by a live route."
7. "Before finishing, remove dead links, unused dependencies, and settings fields that are not exercised by the UI."

## Local Build

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Run `npm run dev` for local development.
4. Run `npm run build` before review or release.
5. Run `npm run start` to serve the production build locally.

## Review Flow

At the end of each modification round:

1. Read [`LLM_CHECK.md`](/D:/Documents/Github/index/LLM_CHECK.md).
2. Run the relevant validation commands.
3. Review the git diff.
4. Use the push helper after review approval.

## One-Click Commit And Push

Reusable helper:

`powershell -ExecutionPolicy Bypass -File .\scripts\review-and-push.ps1 -Message "<commit message>"`

What it does:

1. Fails fast on build errors.
2. Shows `git status` and `git diff --stat`.
3. Stages all changes.
4. Creates a commit with the supplied message.
5. Pushes the current branch to `origin`.

If git reports a safe-directory error on this machine, run this once outside the script:

`git config --global --add safe.directory D:/Documents/Github/index`

## Round Template

For each future round, prepare:

1. A short change summary.
2. A proposed commit message.
3. The one-click push command for that commit.
