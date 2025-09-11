Param(
  [Parameter(Mandatory = $false)]
  [string]$Message = "feat(preview/procedures): UI updates — Procedures (Recente/Comune/Catalog/Tutorial), PRP zones (Scalp/Față) with injection map, recency ordering, Romanian UI",
  [Parameter(Mandatory = $false)]
  [string]$Repo,   # owner/repo (e.g. user/project). If provided with -Token, uses ephemeral push.
  [Parameter(Mandatory = $false)]
  [string]$Token,  # GitHub token for one-off push. Avoids storing in git config.
  [Parameter(Mandatory = $false)]
  [string]$Branch  # Default current branch; set to push to a specific remote branch
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
if (-not $Branch -or $Branch -eq "") {
  $Branch = git rev-parse --abbrev-ref HEAD 2>$null
  if (-not $Branch) { $Branch = "main" }
}

# Warn if identity missing
$name = git config user.name 2>$null
$email = git config user.email 2>$null
if (-not $name -or -not $email) {
  Write-Info "WARNING: git user.name or user.email not set. Consider:"
  Write-Host '  git config user.name "Your Name"'
  Write-Host '  git config user.email "you@example.com"'
}

# Stage, commit
git add -A | Out-Null

# Any staged changes?
$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Info "Nothing to commit (working tree clean)."
} else {
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Push - prefer ephemeral HTTPS with token if provided
if ($Token -and $Repo) {
  $url = "https://$Token@github.com/$Repo.git"
  git push -u $url "HEAD:refs/heads/$Branch"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Info "Done: pushed '$Branch' to $Repo with ephemeral token URL."
  exit 0
}

# Fallback: origin remote
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Err "No 'origin' remote configured and no Token/Repo provided."
  Write-Host "Either set origin or run with: -Repo 'owner/repo' -Token '***' [-Branch 'feat/xyz']"
  exit 1
}

git push -u origin $Branch
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Info "Done: pushed '$Branch' to origin."