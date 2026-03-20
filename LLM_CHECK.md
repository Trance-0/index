# LLM Check

Run this checklist at the end of every modification round.

## Common Errors In This Project

1. Leaving dead links after removing a feature.
2. Removing UI code but forgetting related settings import/export fields.
3. Leaving unused dependencies in `package.json` or `package-lock.json`.
4. Editing `.gitignore` with OS- or editor-specific noise that the project does not need.
5. Writing documentation that does not match the actual scripts or project structure.
6. Finishing without a build check.
7. Forgetting to propose a commit message and one-click push command.

## End-Of-Round Check

1. Search for references to removed features with `rg`.
2. Run `npm run build`.
3. Review `git diff --stat`.
4. Confirm `CODEX.md` still matches the current workflow.
5. Prepare the commit message and push command.
