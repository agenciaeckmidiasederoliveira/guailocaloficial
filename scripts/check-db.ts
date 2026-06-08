import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Faltando credenciais do Supabase no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { count: total } = await supabase.from('empresas').select('*', { count: 'exact', head: true });
  const { count: ativas } = await supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('ativa', true);
  const { count: aprovadas } = await supabase.from('empresas').select('*', { count: 'exact', head: true }).eq('status', 'aprovado');
  
  console.log(`Total rows: ${total}`);
  console.log(`Ativas rows: ${ativas}`);
  console.log(`Aprovadas rows: ${aprovadas}`);
}

check();
