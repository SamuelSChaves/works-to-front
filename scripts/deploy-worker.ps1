Write-Host "Aplicando schema D1 remota (app_db_prd)..."
npx wrangler d1 execute app_db_prd --remote --file=db/schema.sql

Write-Host "Gerando bundle..."
npx wrangler build

Write-Host "Publicando worker..."
npx wrangler deploy

Write-Host "Deploy concluído."
