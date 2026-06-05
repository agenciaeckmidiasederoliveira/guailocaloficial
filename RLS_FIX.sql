-- Execute isso no SQL Editor do Supabase para corrigir a tela de Cadastro de Empresas
ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cidades_public_read" ON cidades FOR SELECT USING (true);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_public_read" ON categorias FOR SELECT USING (true);

ALTER TABLE estados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estados_public_read" ON estados FOR SELECT USING (true);

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresas_public_read" ON empresas FOR SELECT USING (true);
CREATE POLICY "empresas_public_insert" ON empresas FOR INSERT WITH CHECK (true);

ALTER TABLE parceiro_cidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parceiro_cidades_public_read" ON parceiro_cidades FOR SELECT USING (true);
