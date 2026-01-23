$ErrorActionPreference = 'Stop'

function CommitAndPush($context) {
  Write-Host "[$context] Staging changes..."
  git add -A
  $dirty = git status --porcelain
  if (-not $dirty) {
    Write-Host "[$context] Nenhuma alteração para commitar."
  } else {
    $msg = "$context deploy $(Get-Date -Format 'yyyyMMdd-HHmmss')"
    git commit -m $msg
  }
  Write-Host "[$context] Enviando para origin/master..."
  git push origin master
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $scriptRoot
try {
  Write-Host 'Executando npm run front:build...'
  npm run front:build
  CommitAndPush 'Front'
  Write-Host 'Sucesso: frontend buildado e enviado.'
} finally {
  Pop-Location
}
