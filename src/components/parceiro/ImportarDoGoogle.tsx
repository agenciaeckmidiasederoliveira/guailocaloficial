import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Search, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

interface Props {
  cidadeNome: string;
  estadoUf: string;
  onImport: (dados: any) => void;
}

export default function ImportarDoGoogle({ cidadeNome, estadoUf, onImport }: Props) {
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!nome.trim() || !cidadeNome) {
      setErro('Digite o nome da empresa para buscar.');
      return;
    }
    setLoading(true);
    setErro(null);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke('buscar-empresa-google', {
        body: { nome, cidade: cidadeNome, estado: estadoUf }
      });

      if (error) throw error;

      if (!data.encontrado) {
        setErro(data.aviso || 'Empresa não encontrada no Google para esta cidade.');
      } else {
        setResultado(data);
      }
    } catch (err: any) {
      console.error(err);
      setErro('Erro ao se comunicar com o Google. Preencha os dados manualmente.');
    } finally {
      setLoading(false);
    }
  };

  if (resultado?.dados) {
    const d = resultado.dados;
    return (
      <div className="bg-white border-2 border-green-500 rounded-xl p-6 shadow-sm mb-6 relative">
        <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-bold flex items-center">
          <CheckCircle className="w-4 h-4 mr-1" /> Encontrada no Google
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">{d.nome}</h3>
        <p className="text-gray-600 mb-1">{d.endereco} • {d.telefone}</p>
        {d.nota_media && (
          <p className="text-yellow-600 font-medium mb-4">
            ⭐ {d.nota_media} ({d.total_avaliacoes} avaliações)
          </p>
        )}

        <div className="flex space-x-3">
          <button 
            onClick={() => onImport(d)}
            className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Usar estes dados
          </button>
          <button 
            onClick={() => setResultado(null)}
            className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Ignorar
          </button>
        </div>

        {resultado.alternativas && resultado.alternativas.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-3">Não é essa? Tente uma das alternativas:</p>
            <div className="space-y-2">
              {resultado.alternativas.map((alt: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => onImport(alt)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-blue-50 flex justify-between items-center group transition"
                >
                  <div>
                    <strong className="block text-gray-900 group-hover:text-blue-700">{alt.nome}</strong>
                    <span className="text-xs text-gray-500">{alt.endereco}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50/50 border-2 border-dashed border-blue-300 rounded-xl p-6 mb-8 transition-all hover:bg-blue-50">
      <div className="flex items-start mb-4">
        <div className="bg-blue-100 p-2 rounded-lg mr-3">
          <MapPin className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 text-lg">Importar dados do Google</h3>
          <p className="text-blue-700 text-sm">Pré-preencha os dados buscando no Google. Você revisa antes de salvar.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Nome da empresa no Google (ex: Pizzaria do João)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full border border-blue-200 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading || !nome.trim()}
          className="bg-emerald-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold flex items-center disabled:opacity-50 transition"
        >
          {loading ? 'Buscando...' : <><Search className="w-5 h-5 mr-2" /> Buscar</>}
        </button>
      </div>

      {erro && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          {erro}
        </div>
      )}
    </div>
  );
}
