# Fluxo de autenticação com cookie HttpOnly

Este tópico documenta como o backend agora emite um cookie de sessão (`tecrail_session`) e como validar manualmente o comportamento antes de mexer no restante do frontend.

## O que muda no backend

1. O login (`POST /auth/login`) agora retorna o token e registra o mesmo token dentro do cookie `tecrail_session` com `HttpOnly`, `Path=/`, `SameSite=None` quando a conexão é segura (queda para `Lax` em ambiente HTTP/local). O cookie expira junto com o JWT.
2. O worker sempre responde com `Access-Control-Allow-Credentials: true` (exceto quando o `Origin` é `*`), além de `Access-Control-Allow-Origin` ajustado ao valor de `CORS_ORIGIN` ou ao `Origin` da requisição. As rotas de pré-flight (`OPTIONS`) usam o mesmo cabeçalho.
3. Há um novo endpoint `POST /auth/logout` que revoga a sessão atual no banco e expira o cookie, permitindo um logout “limpo” mesmo quando o navegador mantém o cookie.

## Como validar localmente

1. Garanta que o `.dev.vars` (ou suas variáveis de ambiente) tenham `CORS_ORIGIN=http://localhost:5173`. O worker precisa saber qual origem liberar, caso contrário o navegador bloqueia `credentials: include`.
2. Suba o backend com `wrangler dev` (ele já usa o `src/index.ts` alterado). Em paralelo, execute `npm run dev` no `frontend`. O script de `fetch` do frontend já injeta `credentials: 'include'` automaticamente para as chamadas ao `API_URL`.
3. No navegador, abra as DevTools > Network, faça login e confirme que:
   - A resposta de `POST /auth/login` contém `Set-Cookie: tecrail_session=...`.
   - O cookie aparece em Application > Cookies com `HttpOnly` marcado.
4. Verifique também que `GET /auth/permissions` e `/health` retornam 200 com os cabeçalhos CORS apropriados (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`).
5. Clique no botão de logout. O frontend chama `POST /auth/logout` e remove os dados locais; você pode confirmar na aba Network que o cookie volta com `Max-Age=0`.
6. Para testar sessão expirada, force um 401 em `/auth/permissions` (por exemplo, limpando manualmente o token do cookie no painel de cookies). O `fetchPermissions` rejeita e o app redireciona para o login automaticamente.

## Próximos passos

- Depois de validar no ambiente local, rode `wrangler deploy` para propagar as mudanças para o Cloudflare Worker.
- Se quiser remover o token do `localStorage`, pode-se migrar os fetchs que hoje usam `Authorization: Bearer` para confiar somente no cookie; o backend já aceita ambos.
