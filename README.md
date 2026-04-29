# Coulson Assistant Frontend

Interface web do Coulson Assistant para operação de pré-configuração:

- gestão de times
- gestão de participantes (com amostra de voz)
- upload de vídeos por time
- listagem e reprodução de vídeos persistidos

O projeto roda em `SvelteKit 2` com `Svelte 5`, `TypeScript`, `Tailwind CSS v4` e empacotamento via Docker.

## Arquitetura de acesso

- Frontend publicado via Kong em `/coulson-app`
- Backend acessado pelo frontend via Kong em `/coulson` e `/coulson-api`
- Autenticação de acesso da interface por senha de aplicação
- Reprodução de vídeo por URL assinada do Supabase Storage (bucket privado)

## Fluxo de execução

Este repositório está configurado para fluxo Docker-first.

```sh
docker compose --env-file ".env" up --build -d
```

Esse comando recompila a imagem quando houver mudança no código e sobe o container `coulson-assistant-frontend`.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do frontend com:

```env
PUBLIC_API_BASE_URL=https://yellowleafapps.cloud/coulson
PUBLIC_API_BEARER_TOKEN=<token_jwt>
PUBLIC_ACCESS_PASSWORD=<senha_da_interface>
PUBLIC_COULSON_API_TOKEN=<token_x_app_token>
```

Notas:

- `PUBLIC_API_BASE_URL` é a base usada pelo client para chamadas REST.
- `PUBLIC_ACCESS_PASSWORD` protege a UI no login da aplicação.
- `PUBLIC_COULSON_API_TOKEN` é enviado no header `X-App-Token`.
- `PUBLIC_API_BEARER_TOKEN` é enviado no header `Authorization`.

## Rotas principais

- `/login`: autenticação da interface
- `/teams`: CRUD de times e membros
- `/participants`: CRUD de participantes e amostra de voz
- `/videos`: catálogo de vídeos por time e player
- `/videos/upload`: upload para persistência e transcrição

## Build e runtime

- Build de produção com `vite build`
- Runtime com `adapter-node`
- Healthcheck do container em `http://localhost:3000/coulson-app`

## Estrutura resumida

- `src/lib/api.ts`: client HTTP e tipagens dos endpoints
- `src/lib/auth.ts`: autenticação local da interface
- `src/lib/components`: componentes reutilizáveis (sidebar, modal, toast, player)
- `src/routes`: páginas e fluxo de navegação
- `docker-compose.yml`: serviço de execução em container
- `Dockerfile`: build multi-stage e runtime enxuto
