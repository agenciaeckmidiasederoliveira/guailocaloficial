## 1. Remover qualquer valor (R$ 99) do site

Substituir todas as menções de "R$ 99" / "R$ 19,90" por **"Premium vitalício — consulte no WhatsApp"**.

Arquivos:
- `src/lib/constants.ts` — remover `PREMIUM_PRICE`, `PREMIUM_PRICE_CENTS`; manter só o link WhatsApp com texto sem valor
- `src/pages/Vendas.tsx` — card Premium sem número, CTA "Falar no WhatsApp"
- `src/pages/Cadastro.tsx` — idem
- `src/pages/Termos.tsx` — trocar "R$ 99" por "valor único informado via WhatsApp"
- `src/pages/MinhasEstatisticas.tsx` — idem
- Buscar `99` em todo o repo para garantir varredura

## 2. Sistema regional (parceiro ↔ várias cidades)

### Migration
```sql
ALTER TABLE parceiros 
  ADD COLUMN cidades_atendidas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN slug TEXT UNIQUE,
  ADD COLUMN bio TEXT,
  ADD COLUMN avatar_url TEXT;

-- Função: lista empresas das cidades atendidas pelo parceiro logado
CREATE FUNCTION get_empresas_minhas_cidades() RETURNS SETOF empresas ...
```

`cidades_atendidas` formato: `[{"estado":"PR","cidade":"Curitiba"}, ...]`

### Painel do parceiro (`/parceiro`)
- Aba "Minhas Cidades" — lista cidades atendidas (gerenciada por admin)
- Aba "Empresas da Região" — todas as empresas aprovadas nas suas cidades (não só as que ele cadastrou)
- Aba "Meus Cadastros" — empresas que ele criou (filtro por `usuario_id`)
- Analytics: views, cliques WhatsApp, etc. agregados das empresas das suas cidades

### Página pública do parceiro (`/parceiro/:slug`)
Nova página com:
- Bio do parceiro, avatar, nível, cidades atendidas
- Grid de empresas aprovadas nas cidades do parceiro
- CTA "Cadastre sua empresa com [Nome do parceiro]" → WhatsApp do parceiro

### Página da cidade (`/cidade/:estado/:cidade`)
Adicionar bloco no topo: **"Parceiro local: [Nome] — fale no WhatsApp"** quando existir parceiro com aquela cidade na lista.

## 3. Painel admin estendido

Nova aba `/admin/parceiros-analytics`:
- Tabela com cada parceiro: nº empresas free, nº premium, views totais, cliques WhatsApp, conversões, **soma de vendas premium** (via tabela `pagamentos` cruzando por `usuario_id` das empresas do parceiro)
- Botão "Editar cidades atendidas" por parceiro (modal com select múltiplo de cidades por estado)
- Export CSV

## 4. Importação em massa via XLSX

### Biblioteca
Instalar `xlsx` (SheetJS) — leitura e geração de arquivos `.xlsx`.

### Onde
- Admin: `/admin/empresas` → botão **"Baixar modelo XLSX"** + **"Importar XLSX"**
- Parceiro: `/parceiro` → mesma dupla de botões (insere com `usuario_id = parceiro logado` e `plano = free`, `status = aprovado`)

### Modelo padrão (`modelo-empresas.xlsx`)
Colunas (linha 1 = cabeçalho, linha 2 = exemplo preenchido):
```
nome | telefone | whatsapp | email | nicho | estado | cidade | endereco | 
descricao | site | horario | foto_url | instagram | facebook
```
- `nome`, `telefone`, `whatsapp`, `estado`, `cidade`, `nicho`, `endereco` = obrigatórios
- `foto_url` = link público da foto/logo (será gravado em `foto_principal`)
- `instagram`/`facebook` = preenchem `redes_sociais` JSONB

### Fluxo de import
1. Usuário escolhe `.xlsx`
2. Parse client-side com SheetJS
3. Validação Zod por linha
4. Mostra preview (X válidas / Y erros, com motivo por linha)
5. Botão "Confirmar importação" → bulk insert no Supabase em chunks de 50
6. Toast com resultado: "X importadas, Y falharam"

### Segurança
- Validação Zod por linha
- Limite: 500 linhas por planilha
- Apenas admin/parceiro autenticado

## Resumo técnico (detalhes)

- Nova migration para `parceiros` (cidades_atendidas, slug, bio, avatar_url)
- Nova função RPC `get_empresas_por_cidades_parceiro(p_parceiro_id)`
- Novo componente `BulkImportXLSX.tsx` reutilizado por admin e parceiro
- Novo arquivo `src/lib/empresa-import-schema.ts` (validação Zod)
- Nova página `src/pages/ParceiroPublico.tsx` em rota `/parceiro/:slug`
- Novo componente `src/components/admin/AdminParceirosAnalytics.tsx`
- Atualização de `src/pages/Parceiro.tsx` com tabs "Cidades / Região / Meus Cadastros / Importar"
- Atualização de `src/pages/Cidade.tsx` com banner do parceiro local
- Remoção total de menções de valor em constants + 4 páginas

### O que NÃO está no escopo (para não inflar)
- Pagamentos automáticos (continua manual via WhatsApp)
- Geração de planilha por região automática
- Cobrança/comissão automática por parceiro (só visualização de vendas)

Posso seguir?
