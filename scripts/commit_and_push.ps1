Param(
  [Parameter(Mandatory = $false)]
  [string]$Message = "feat(preview/procedures): UI updates — Procedures (Recente/Comune/Catalog/Tutorial), PRP zones (Scalp/Față) with injection map, recency ordering, Romanian UI"
)

function Write-Info($msg) { Write-Host $msg -ForegroundColor Cyan }
function Write-Err($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red }

# Check git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Err "git not found. Install Git and retry."
  exit 1
}

# Ensure in repo
$inside = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Err "Not a Git repository. Initialize or cd into the repo."
  exit 1
}

# Branch
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $branch) { $branch = "main" }

# Warn if identity missing
$name = git config user.name 2>$null
$email = git config user.email 2>$null
if (-not $name -or -not $email) {
  Write-Info "WARNING: git user.name or user.email not set. Consider:"
  Write-Host '  git config user.name "Your Name"'
  Write-Host '  git config user.email "you@example.com"'
}

# Remote check
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Err "No 'origin' remote configured."
  Write-Host "Add it, then rerun this script:"
  Write-Host "  git remote add origin https://github.com/<org>/<repo>.git"
  Write-Host "  git fetch origin"
  Write-Host "  git branch -u origin/$branch"
  exit 1
}

# Stage, commit, push
git add -A | Out-Null

# Any staged changes?
$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Info "Nothing to commit (working tree clean)."
  git push -u origin $branch
  exit 0
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git push -u origin $branch
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Info "Done: pushed '$branch' to origin."