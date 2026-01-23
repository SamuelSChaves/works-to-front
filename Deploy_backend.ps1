#!/usr/bin/env pwsh >>>>>>> comando para start pwsh ./Deploy_backend

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

$scriptRoot = Split-Path -LiteralPath $MyInvocation.MyCommand.Definition -Parent
Push-Location $scriptRoot
try {
  Write-Host "Aplicando schema + seed e publicando o backend..."
  pwsh -ExecutionPolicy Bypass -File .\scripts\deploy-worker.ps1
  CommitAndPush 'Backend'
  Write-Host 'Sucesso: backend atualizado e deploy feito.'
} finally {
  Pop-Location
}
