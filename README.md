# Nossa casa

App interno para dividir a mudança e comparar imóveis entre dois moradores.
Next.js (App Router) + Supabase (Postgres, Auth, RLS) + AntD/Tailwind.

## Rodando localmente

```bash
yarn install
cp .env.local.example .env.local   # preencha com os dados do seu projeto Supabase
yarn dev
```

`.env.local` precisa de:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/publishable key — nunca a service_role)

## Banco de dados

Migrations em `supabase/migrations/`, uma por tabela (`households`,
`household_members`, `checklist_items`, `properties`, `property_ratings`),
todas com RLS fechada por `household_id`/`household_member_id`.

Para aplicar migrations novas no projeto remoto (sem precisar de
`supabase login`):

```bash
npx supabase db push --db-url "postgresql://postgres:<SENHA>@db.<REF>.supabase.co:5432/postgres"
```

Depois de alterar o schema, regenere os tipos TS:

```bash
npx supabase gen types typescript --db-url "postgresql://postgres:<SENHA>@db.<REF>.supabase.co:5432/postgres" --schema public > src/lib/types/database.ts
```

`ChecklistCategory` e `PropertyStatus` (union types manuais, pois são
`text` + `CHECK` no banco, não enum) ficam anexados no fim desse mesmo
arquivo — reaplique esse trecho se regerar o arquivo do zero.

## Autenticação

Login exclusivo via Google (Supabase Auth), sem cadastro público. Um
morador só ganha acesso se seu e-mail já existir em
`household_members.invited_email` — o vínculo com a conta Google real
acontece sozinho no primeiro login (trigger `handle_new_user`). Para
convidar alguém, insira uma linha em `household_members` com o e-mail
Google da pessoa.

## Estrutura

- `src/app/login` — tela de login (Google OAuth)
- `src/app/auth/callback` — troca o `code` do OAuth pela sessão
- `src/app/(app)` — área logada (layout com sidebar, checklist, imóveis)
- `src/lib/supabase` — clients browser/server + refresh de sessão (`proxy.ts`)
- `src/lib/theme` — tema AntD (Solarized Light pastel) compartilhado com o Tailwind
