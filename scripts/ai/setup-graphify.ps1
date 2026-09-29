param(
    [switch]$BuildGraph
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command graphify -ErrorAction SilentlyContinue)) {
    Write-Host "Graphify CLI not found. Checking uv..."
    if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
        throw "Neither graphify nor uv is available on PATH. Install uv first, then rerun this script."
    }

    Write-Host "Installing Graphify CLI (PyPI package: graphifyy)..."
    uv tool install graphifyy

    if (-not (Get-Command graphify -ErrorAction SilentlyContinue)) {
        Write-Host "graphify is not visible in this PowerShell session. Running 'uv tool update-shell'..."
        uv tool update-shell
        throw "Graphify was installed, but this terminal does not see it yet. Open a new PowerShell window and rerun this script."
    }
} else {
    Write-Host "Graphify CLI already available."
}

Write-Host "Refreshing project-scoped GitHub Copilot Graphify skill..."
graphify copilot install --project

Write-Host "Refreshing project-scoped Codex Graphify skill..."
graphify codex install --project

Write-Host "Refreshing generic Agent-Skills Graphify skill..."
graphify agents install --project

Write-Host "Graphify version:"
graphify --version

Write-Host "Validating repository AI support..."
node .agents/skills/japanese-day-handoff/scripts/validate-install.mjs

if ($BuildGraph) {
    Write-Host "Building initial code-only Graphify index..."
    graphify extract . --code-only
}

Write-Host "Graphify setup complete."
if (-not $BuildGraph) {
    Write-Host "When ready, build the initial graph with: graphify extract . --code-only"
}
