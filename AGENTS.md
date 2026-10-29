# K&M Real Estate collaboration

## Shared requirements
Both assistants must follow the same owner-approved K&M Real Estate master development requirements. No master requirements document was present at setup. Obtain and record the approved requirements in a shared tracked document before implementation; do not invent product requirements. This setup does not authorize website development.

## Workspaces and responsibilities
- Original: `D:\K&M Real Estate`, branch `main`: reviewed integration work.
- Codex: `D:\K&M Real Estate-codex`, branch `codex/backend`: backend, database, authentication, APIs, and integration.
- GitHub Copilot: `D:\K&M Real Estate-copilot`, branch `copilot/frontend`: React components, pages, styling, responsiveness, and UI testing.
- Work only in your assigned worktree. Agree on API contracts before dependent work. Coordinate changes to shared configuration, dependencies, lockfiles, requirements, and this document.
- Preserve existing files and assets. Never reset, clean, force push, or discard another assistant's changes. Review and stage explicit paths; never commit all files blindly.

## Open separate VS Code windows
```powershell
code -n 'D:\K&M Real Estate-codex'
code -n 'D:\K&M Real Estate-copilot'
```
Use Codex in the first window and Copilot in the second. Check `git branch --show-current` before editing. Each worktree has its own working files and index, with shared Git history.

## Assets and environment setup
- The initial commit is empty. The existing `images`, `screenshots`, and `videos` folders remain only in the original project directory; Git does not replicate uncommitted or ignored files into worktrees.
- The original index contains staged assets from a separate Git operation. Do not commit that index wholesale. Review assets individually before any future commit; do not automatically commit large videos.
- Until an asset workflow is approved, reference original assets read-only. Do not move, overwrite, or duplicate the asset library as part of worktree setup. Future selected assets may be committed after review; large videos need an agreed external storage or Git LFS workflow.
- No application, dependency manifest, environment template, or ignore policy existed at setup. Before development, establish ignore rules for secrets (`.env`, `.env.*` except sanitized examples), dependencies, build output, caches, logs, and locally provisioned large assets. Ignore rules do not unstage already staged files.
- Provision real environment files separately in each worktree using approved secrets. Commit only sanitized example files with placeholders. Never commit credentials, private keys, database dumps, or unnecessary generated files.
- Install dependencies separately in each worktree once manifests exist. Use separate local ports and development database/schema names to avoid collisions.

## Integrate completed work
Commit reviewed explicit paths on the assigned branch and run relevant checks. With a clean original worktree, integrate one branch at a time:
```powershell
git -C 'D:\K&M Real Estate' merge --no-ff codex/backend
git -C 'D:\K&M Real Estate' merge --no-ff copilot/frontend
```
Review conflicts and run combined checks before pushing. Do not run merges while the original worktree has staged assets or other pending changes; first agree with their owner how to preserve them. No remote was configured during worktree setup.

To incorporate reviewed main changes, with a clean assigned worktree, run `git merge main` there. Shared instructions change through reviewed commits and merges, not by silently editing another worktree.
