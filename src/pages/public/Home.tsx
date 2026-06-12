import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { registrarEvento } from '../../lib/analytics';
import { getTenantFromURL } from '../../lib/tenant';
import './Home.css';
import { Search, MapPin, Sparkles, Bell, ChevronRight, Star, Heart, ExternalLink, Calendar } from 'lucide-react';

// Fixed categories that match the filter list in Busca.tsx
const CATS = [
  { n: "Alimentação", e: "🍽️", bg: "#FFF3E0", c: "#E07B00", slug: "Alimentação" },
  { n: "Beleza e Estética", e: "💆", bg: "#FEE8F2", c: "#C2185B", slug: "Beleza e Estética" },
  { n: "Automotivo", e: "🚗", bg: "#EBF5FF", c: "#1565C0", slug: "Automotivo" },
  { n: "Saúde", e: "🏥", bg: "#F0EEFF", c: "#512DA8", slug: "Saúde" },
  { n: "Pet Shop", e: "🐾", bg: "#E8F8F2", c: "#2E7D32", slug: "Pet Shop" },
  { n: "Disk Gás", e: "🔥", bg: "#FFFAE0", c: "#E65100", slug: "Depósito de Gás" },
  { n: "Jurídico", e: "⚖️", bg: "#EEEEFF", c: "#311B92", slug: "Advocacia" },
  { n: "Tecnologia", e: "💻", bg: "#EBF5FF", c: "#0D47A1", slug: "Tecnologia" },
  { n: "Moda", e: "👗", bg: "#F5EEFF", c: "#6A1B9A", slug: "Moda" },
  { n: "Decoração", e: "🏠", bg: "#E8F8F2", c: "#00695C", slug: "Casa e Decoração" },
  { n: "Construção", e: "🏗️", bg: "#EEEEFF", c: "#283593", slug: "Construção" },
  { n: "Supermercado", e: "🛒", bg: "#E4F6EE", c: "#1B5E20", slug: "Supermercado" },
  { n: "Serviços", e: "🛠️", bg: "#F0F4C3", c: "#827717", slug: "Serviços Gerais" },
  { n: "Educação", e: "📚", bg: "#E1F5FE", c: "#0277BD", slug: "Educação" },
  { n: "Imóveis", e: "🏡", bg: "#F3E5F5", c: "#4A148C", slug: "Imobiliário" },
  { n: "Eventos", e: "🎉", bg: "#FFF8E1", c: "#F57F17", slug: "Eventos e Festas" }
];

const DEFAULT_BANNERS = [
  { tag: "PAIÇANDU · PR", h: "Alkazar Disk Pizza", sub: "A pizza mais pedida de Paiçandu. Delivery rápido, sabor garantido!", e: "🍕", g: "linear-gradient(135deg,#7B2D00,#D4520A)", btn: "Pedir Agora", wa: "554499999999" },
  { tag: "MARINGÁ · PR", h: "Rachid Odontologia", sub: "Sorria com confiança. Clareamento, implantes e ortodontia em Maringá.", e: "🦷", g: "linear-gradient(135deg,#0A1E50,#1A5CB5)", btn: "Agendar Consulta", wa: "554499999999" },
  { tag: "MARINGÁ · PR", h: "di Domenico Casa", sub: "Decoração de alto padrão. Transforme seu lar com elegância e estilo.", e: "🏠", g: "linear-gradient(135deg,#0A2E1E,#1A7A4A)", btn: "Conhecer Loja", wa: "554499999999" },
  { tag: "PAIÇANDU · PR", h: "Evolution Car Guincho 24h", sub: "Guincho rápido 24 horas. Centro automotivo completo em Sarandi/PR.", e: "🚗", g: "linear-gradient(135deg,#1A0A2E,#5A1AA0)", btn: "Chamar Agora", wa: "554499999999" },
  { tag: "MARINGÁ · PR", h: "Viva Gás Maringá", sub: "Entrega de gás em até 30 minutos. Atendemos toda a região de Maringá.", e: "🔥", g: "linear-gradient(135deg,#2E1A00,#A05A00)", btn: "Pedir Gás", wa: "554499999999" },
  { tag: "POUSO ALEGRE · MG", h: "Restaurante da Déia", sub: "A culinária mineira mais autêntica de Pouso Alegre. Venha se deliciar!", e: "🍽️", g: "linear-gradient(135deg,#1A2E0A,#3A7A1A)", btn: "Ver Cardápio", wa: "553599999999" }
];

const DEFAULT_MARCAS = [
  { n: "Supermercado Iguaçu", cat: "Supermercado", c: "Maringá · PR", e: "🛒", bg: "#E4F6EE" },
  { n: "Rachid Odontologia", cat: "Odontologia", c: "Maringá · PR", e: "🦷", bg: "#F0EEFF" },
  { n: "di Domenico Casa", cat: "Casa & Decoração", c: "Maringá · PR", e: "🏠", bg: "#E8F8F2" },
  { n: "Evolution Car", cat: "Centro Automotivo", c: "Sarandi · PR", e: "🚗", bg: "#EBF5FF" }
];

const DEFAULT_CIDS = [
  { n: "Paiçandu", u: "PR", ct: 18, big: true, bg: "#0A2E1E" },
  { n: "Maringá", u: "PR", ct: 11, bg: "#0A1E50" },
  { n: "Pouso Alegre", u: "MG", ct: 8, bg: "#1A104A" },
  { n: "Curitiba", u: "PR", ct: 3, bg: "#0A2A1A" },
  { n: "Sarandi", u: "PR", ct: 1, bg: "#1A2A0A" },
  { n: "Ilhéus", u: "BA", ct: 1, bg: "#2A100A" },
  { n: "Vila Velha", u: "ES", ct: 1, bg: "#0A1A3A" },
  { n: "Petrópolis", u: "RJ", ct: 1, bg: "#2A1A0A" }
];

const PLACEHOLDERS = [
  "Pizzaria em Maringá...",
  "Mecânico em Paiçandu...",
  "Dentista em Curitiba...",
  "Pet Shop em Pouso Alegre...",
  "Advogado em Nova Aurora...",
  "Disk Gás em Maringá...",
  "Estética em Ilhéus..."
];

const DEFAULT_POSTS = [
  {
    titulo: "Como colocar sua empresa no topo das buscas locais do Google em 2026",
    tag: "DICAS DE NEGÓCIO",
    tagColor: "#0F6B4A",
    tagBg: "#E2F7EE",
    bg: "linear-gradient(135deg,#E2F7EE,#C8EAD8)",
    emoji: "🏆",
    meta: "02 Jun 2026 · 5 min de leitura",
    slug: "topo-das-buscas-locais"
  },
  {
    titulo: "Por que empresas premium recebem 10x mais cliques no WhatsApp",
    tag: "PREMIUM",
    tagColor: "#1A3A8A",
    tagBg: "#EDF6FF",
    bg: "linear-gradient(135deg,#EDF6FF,#C8DCFF)",
    emoji: "⭐",
    meta: "01 Jun 2026 · 3 min",
    slug: "empresas-premium-cliques-whatsapp"
  },
  {
    titulo: "Seja o consultor exclusivo do Guia Local BR na sua cidade",
    tag: "PARCEIROS",
    tagColor: "#7D4000",
    tagBg: "#FFF3E0",
    bg: "linear-gradient(135deg,#FFF3E0,#FFE0B2)",
    emoji: "📍",
    meta: "30 Mai 2026 · 4 min",
    slug: "consultor-exclusivo"
  }
];

const MQ_CITIES = [
  "Maringá · PR", "Paiçandu · PR", "Sarandi · PR", "Curitiba · PR", "Vila Velha · ES",
  "Petrópolis · RJ", "Cuiabá · MT", "Ilhéus · BA", "Vilhena · RO", "Nova Aurora · PR",
  "Araraquara · SP", "Alfenas · MG", "Cotia · SP", "Americana · SP", "Nova Odessa · SP",
  "Primavera do Leste · MT", "S.J. dos Pinhais · PR", "Pouso Alegre · MG", "Campo Mourão · PR",
  "Londrina · PR"
];

const SIMULATED_ACTIVITIES = [
  { emoji: "💬", txt: "Roberto iniciou contato via WhatsApp com di Domenico Casa (Maringá · PR)" },
  { emoji: "📞", txt: "Ana ligou para Alkazar Disk Pizza (Paiçandu · PR)" },
  { emoji: "⭐", txt: "Carlos avaliou MR Clínica de Estética com 5 estrelas (Curitiba · PR)" },
  { emoji: "🚗", txt: "Marcos buscou por Guincho 24h em Sarandi · PR" },
  { emoji: "🍽️", txt: "Júlia visualizou o cardápio do Restaurante da Déia (Pouso Alegre · MG)" },
  { emoji: "💆", txt: "Letícia agendou estética com Sirleia Souza (Ilhéus · BA)" },
  { emoji: "🔥", txt: "Felipe pediu gás na Viva Gás Maringá (Maringá · PR)" },
  { emoji: "🏢", txt: "Nova empresa registrada: Evolution Car em Sarandi · PR" }
];

export default function Home() {
  const navigate = useNavigate();
  const [termoBusca, setTermoBusca] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [tenant, setTenant] = useState<any>(null);

  // Dynamic Data States
  const [allEmpresas, setAllEmpresas] = useState<any[]>([]);
  const [empresasDestaque, setEmpresasDestaque] = useState<any[]>([]);
  const [empresasRecentes, setEmpresasRecentes] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [artigos, setArtigos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCats, setFilteredCats] = useState<any[]>([]);
  const [filteredCids, setFilteredCids] = useState<any[]>([]);

  // Ticker activity
  const [currentActivityIdx, setCurrentActivityIdx] = useState(0);

  // Banners carousel state
  const [bannerIdx, setBannerIdx] = useState(0);
  const [banners, setBanners] = useState<any[]>(DEFAULT_BANNERS);

  // Stats Counters
  const [counters, setCounters] = useState({ empresas: 0, cidades: 0, estados: 0, premium: 0 });
  const [finalCounters, setFinalCounters] = useState({ empresas: 49, cidades: 20, estados: 10, premium: 34 });

  // Favorites (persisted locally)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('guia_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Track page view event
  useEffect(() => {
    registrarEvento('page_view', { origem: 'home' });
    void loadData();
  }, []);

  // Rotating placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // Rotate simulated activities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivityIdx(prev => (prev + 1) % SIMULATED_ACTIVITIES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Update autocomplete suggestions
  useEffect(() => {
    if (!termoBusca.trim()) {
      setFilteredCats([]);
      setFilteredCids([]);
      return;
    }
    const term = termoBusca.toLowerCase();
    
    // Filter categories
    const matchingCats = CATS.filter(c => c.n.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)).slice(0, 4);
    setFilteredCats(matchingCats);

    // Filter cities
    const matchingCids = cidades.filter(c => c.nome.toLowerCase().includes(term)).slice(0, 4);
    setFilteredCids(matchingCids);
  }, [termoBusca, cidades]);

  // Auto-advance banners slider
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIdx(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  // Countup animation
  useEffect(() => {
    let startTime = performance.now();
    const duration = 1500; // 1.5s animation

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);

      setCounters({
        empresas: Math.round(easedProgress * finalCounters.empresas),
        cidades: Math.round(easedProgress * finalCounters.cidades),
        estados: Math.round(easedProgress * finalCounters.estados),
        premium: Math.round(easedProgress * finalCounters.premium)
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCounters(finalCounters);
      }
    };

    requestAnimationFrame(animate);
  }, [finalCounters]);

  // Load all initial database records
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get tenant
      const t = await getTenantFromURL();
      setTenant(t);

      // 2. Fetch approved companies
      let query = supabase
        .from('empresas')
        .select(`
          id, nome, slug, foto_principal, plano, nicho, telefone, whatsapp, site, redes_sociais, status, categoria_id, criado_em,
          cidades(id, nome, slug, estado_id, estados(id, nome, uf))
        `)
        .eq('status', 'aprovado');

      if (t?.id) {
        query = query.eq('tenant_id', t.id);
      }

      const { data: emps, error } = await query;
      if (error) throw error;

      if (emps) {
        setAllEmpresas(emps);

        // Compute real statistics
        const premiumEmps = emps.filter(e => e.plano === 'premium' || e.plano === 'turbo');
        const uniqueCityIds = new Set(emps.map(e => e.cidades?.id).filter(Boolean));
        const uniqueStateIds = new Set(emps.map(e => e.cidades?.estados?.id).filter(Boolean));

        setFinalCounters({
          empresas: emps.length,
          cidades: uniqueCityIds.size > 0 ? uniqueCityIds.size : 16,
          estados: uniqueStateIds.size > 0 ? uniqueStateIds.size : 8,
          premium: premiumEmps.length
        });

        // Set Destaque Grid (Premium first, up to 12)
        const sortedDestaques = [...emps]
          .sort((a, b) => {
            const planA = a.plano === 'premium' || a.plano === 'turbo' ? 2 : 1;
            const planB = b.plano === 'premium' || b.plano === 'turbo' ? 2 : 1;
            return planB - planA; // Premium first
          })
          .slice(0, 12);
        setEmpresasDestaque(sortedDestaques);

        // Set Recentes Grid (Remaining companies sorted by created date)
        const sortedRecentes = [...emps]
          .sort((a, b) => new Date(b.criado_em || 0).getTime() - new Date(a.criado_em || 0).getTime())
          .slice(0, 12);
        setEmpresasRecentes(sortedRecentes);

        // Map Banners merging database records for correct WA links
        const mappedBanners = DEFAULT_BANNERS.map(b => {
          const dbEmp = emps.find(e => e.nome.toLowerCase().includes(b.h.toLowerCase()) || b.h.toLowerCase().includes(e.nome.toLowerCase()));
          if (dbEmp) {
            return {
              ...b,
              bgImg: dbEmp.foto_principal || null,
              wa: dbEmp.whatsapp || dbEmp.telefone || b.wa,
              slug: dbEmp.slug
            };
          }
          return b;
        });
        setBanners(mappedBanners);
      }

      // 3. Fetch cities
      const { data: citiesData } = await supabase
        .from('cidades')
        .select('id, nome, slug, foto_url, estados(uf)')
        .limit(12);

      if (citiesData && emps) {
        const mappedCids = citiesData.map(c => {
          const count = emps.filter(e => e.cidades?.id === c.id).length;
          return {
            id: c.id,
            nome: c.nome,
            uf: c.estados?.uf || 'BR',
            count,
            foto: c.foto_url
          };
        }).filter(c => c.count > 0);
        
        setCidades(mappedCids.length > 0 ? mappedCids : DEFAULT_CIDS.map(c => ({
          id: c.n,
          nome: c.n,
          uf: c.u,
          count: c.ct,
          foto: null
        })));
      } else {
        setCidades(DEFAULT_CIDS.map(c => ({
          id: c.n,
          nome: c.n,
          uf: c.u,
          count: c.ct,
          foto: null
        })));
      }

      // 4. Fetch blog posts
      const { data: blogData } = await supabase
        .from('artigos')
        .select('*')
        .eq('publicado', true)
        .order('publicado_em', { ascending: false })
        .limit(3);

      if (blogData && blogData.length > 0) {
        setArtigos(blogData);
      } else {
        setArtigos([]);
      }

    } catch (err) {
      console.error("Erro carregando dados da Home:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Search Submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (termoBusca.trim()) {
      navigate(`/busca?q=${encodeURIComponent(termoBusca.trim())}`);
    }
  };

  // Toggle favorite company
  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('guia_favorites', JSON.stringify(next));
      return next;
    });
  };

  // Safe phone format
  const formatPhone = (p: string) => {
    if (!p) return '';
    const n = String(p).replace(/\D/g, '');
    if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
    return p;
  };

  // Count businesses in category locally
  const getCatCount = (catSlug: string) => {
    if (!allEmpresas.length) return Math.floor(Math.random() * 8 + 3);
    
    // Map cat slug to local DB category mapping
    return allEmpresas.filter(e => {
      const nicho = (e.nicho || '').toLowerCase();
      const slug = catSlug.toLowerCase();
      if (slug === 'restaurantes') {
        return nicho.includes('restaurante') || nicho.includes('pizza') || nicho.includes('hamburguer') || nicho.includes('alimenta') || nicho.includes('gourmet') || nicho.includes('bebida') || nicho.includes('doce') || nicho.includes('carne') || nicho.includes('conveniencia');
      }
      if (slug === 'beleza & estética') {
        return nicho.includes('beleza') || nicho.includes('estética') || nicho.includes('estetica') || nicho.includes('salão') || nicho.includes('salao') || nicho.includes('unha') || nicho.includes('cabelo') || nicho.includes('micro');
      }
      if (slug === 'saúde') {
        return nicho.includes('saúde') || nicho.includes('saude') || nicho.includes('odonto') || nicho.includes('dentista') || nicho.includes('médic') || nicho.includes('medic') || nicho.includes('clínica') || nicho.includes('clinica') || nicho.includes('farmácia') || nicho.includes('farmacia');
      }
      if (slug === 'automóveis') {
        return nicho.includes('auto') || nicho.includes('car') || nicho.includes('veículo') || nicho.includes('moto') || nicho.includes('guincho') || nicho.includes('borracha') || nicho.includes('lava') || nicho.includes('pneu') || nicho.includes('oficina') || nicho.includes('mecânic') || nicho.includes('mecanic');
      }
      if (slug === 'pets') {
        return nicho.includes('pet') || nicho.includes('animal') || nicho.includes('cão') || nicho.includes('gato') || nicho.includes('veterinári') || nicho.includes('veterinari') || nicho.includes('banho') || nicho.includes('tosa');
      }
      if (slug === 'serviços') {
        return nicho.includes('serviço') || nicho.includes('limpeza') || nicho.includes('pint') || nicho.includes('constru') || nicho.includes('depósito') || nicho.includes('entreg') || nicho.includes('frete') || nicho.includes('gás') || nicho.includes('gas') || nicho.includes('chave');
      }
      if (slug === 'lojas & comércio') {
        return nicho.includes('loja') || nicho.includes('comércio') || nicho.includes('comercio') || nicho.includes('varejo') || nicho.includes('venda') || nicho.includes('supermercado') || nicho.includes('mercad') || nicho.includes('horti') || nicho.includes('moda') || nicho.includes('roupa') || nicho.includes('sapato') || nicho.includes('acessório') || nicho.includes('acessorio') || nicho.includes('perfum');
      }
      if (slug === 'tecnologia') {
        return nicho.includes('tecnologia') || nicho.includes('computa') || nicho.includes('celular') || nicho.includes('internet') || nicho.includes('ti') || nicho.includes('desenvolvi') || nicho.includes('software') || nicho.includes('telecom');
      }
      if (slug === 'imobiliárias') {
        return nicho.includes('imóvel') || nicho.includes('imovel') || nicho.includes('imobili') || nicho.includes('casa') || nicho.includes('apart') || nicho.includes('alug') || nicho.includes('corretor');
      }
      if (slug === 'educação') {
        return nicho.includes('educa') || nicho.includes('escola') || nicho.includes('curso') || nicho.includes('facul') || nicho.includes('aprend');
      }
      return nicho === slug || nicho.includes(slug);
    }).length;
  };

  // Render Card Component
  const renderCard = (emp: any) => {
    const waNumber = String(emp.whatsapp || emp.telefone || '').replace(/\D/g, '');
    const waLink = `https://wa.me/55${waNumber}`;
    
    let instagram = '';
    let facebook = '';
    let website = emp.site || '';
    
    if (emp.redes_sociais) {
      try {
        const rs = typeof emp.redes_sociais === 'string' 
          ? JSON.parse(emp.redes_sociais) 
          : emp.redes_sociais;
        instagram = rs.instagram || '';
        facebook = rs.facebook || '';
      } catch {
        // Safe fallback
      }
    }

    const isFavorite = favorites.includes(emp.id);
    const isPremium = emp.plano === 'premium' || emp.plano === 'turbo';

    return (
      <div 
        key={emp.id} 
        className={`ecard animate-hover-float ${isPremium ? 'premium-card-glow border-amber-500/40 shadow-premium' : ''} dark:bg-slate-900 dark:border-slate-800`} 
        onClick={() => navigate(`/empresa/${emp.slug}`)}
      >
        <div className="ecard-top">
          <div className="ebadge-row">
            {emp.plano === 'premium' || emp.plano === 'turbo' ? (
              <span className="ebadge-prem">
                <svg viewBox="0 0 24 24" style={{ width: '12px', height: '12px', stroke: 'currentColor', fill: 'none', strokeWidth: '2.5' }}>
                  <path d="M2 4h20l-2 16H4zM12 4v16"/><path d="M6 4v16M18 4v16"/>
                </svg> 
                Premium
              </span>
            ) : <span></span>}
            <span 
              className={`ebadge-fav ${isFavorite ? 'active' : ''}`}
              onClick={(e) => toggleFavorite(e, emp.id)}
            >
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', stroke: 'currentColor', fill: isFavorite ? 'currentColor' : 'none', strokeWidth: '2' }}>
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.9 7.9 7.8-7.9 1-1a5.5 5.5 0 0 0 0-7.8z"/>
              </svg>
            </span>
          </div>
          {emp.foto_principal ? (
            <img src={emp.foto_principal} alt={emp.nome} className="ecard-img" />
          ) : (
            <div style={{ fontSize: '50px' }}>🏢</div>
          )}
        </div>
        <div className="ecard-body">
          <div className="ecard-title">{emp.nome}</div>
          {emp.nicho && <div className="ecard-tag">{emp.nicho}</div>}
          
          {emp.cidades && (
            <div className="ecard-row">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {emp.cidades.nome}, {emp.cidades.estados?.uf}
            </div>
          )}
          
          {(emp.whatsapp || emp.telefone) && (
            <div className="ecard-row">
              <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {formatPhone(emp.whatsapp || emp.telefone)}
            </div>
          )}
          
          <div className="ecard-div"></div>
          
          <div className="ecard-actions">
            <a 
              href={waLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ecard-btn ecard-wa-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              WhatsApp
            </a>
            {instagram && (
              <a 
                href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ecard-btn ecard-ig-btn" 
                title="Instagram"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            )}
            {facebook && (
              <a 
                href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ecard-btn ecard-fb-btn" 
                title="Facebook"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            )}
            {website && (
              <a 
                href={website.startsWith('http') ? website : `https://${website}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ecard-btn ecard-site-btn" 
                title="Website"
                onClick={(e) => e.stopPropagation()}
              >
                <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Doubled marquee lists for smooth loops
  const doubleMqCities = [...MQ_CITIES, ...MQ_CITIES];
  const doubleMarcas = [...DEFAULT_MARCAS, ...DEFAULT_MARCAS];

  return (
    <div className="guia-v2-container">
      
      {/* NAVBAR */}
      <nav className="nav">
        <div className="nlogo">
          <div className="nicon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <div className="nbrand">Guia Local <b>BR</b></div>
        </div>
        <div className="nmenu">
          <Link className="nlink" to="/">Início</Link>
          <Link className="nlink" to="/busca">Buscar Empresas</Link>
          <Link className="nlink" to="/cadastro">Cadastrar Empresa</Link>
          <Link className="nlink" to="/admin">Dashboard Admin</Link>
          <Link className="nlink" to="/cadastro">Planos</Link>
          <Link className="nlink" to="/blog">Blog</Link>
          <Link className="nlink" to="/parceiro">Parceiros</Link>
        </div>
        <div className="nacts">
          <Link className="selink" to="/cadastro">
            Anunciar aqui 
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero bg-gradient-shift bg-gradient-to-br from-slate-50 via-teal-50/20 to-blue-50/30 dark:from-slate-950 dark:via-emerald-950/10 dark:to-slate-900 border-b border-border/40">
        <div className="hero-grid"></div>
        <div className="hero-glow animate-pulse-slow"></div>
        <div className="hero-inner">
          <div className="hbadge shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-emerald-400">
            <div className="hdot bg-emerald-500"></div>
            O MAIOR GUIA COMERCIAL DO BRASIL
          </div>
          <h1 className="dark:text-white">Encontre os Melhores<br/>Negócios <span className="grad">Locais</span><br/>da Sua Região</h1>
          <p className="hero-sub dark:text-slate-300">Conecte-se com empresas verificadas e fale diretamente pelo WhatsApp — rápido, gratuito e seguro.</p>
          
          <div className="relative max-w-xl mx-auto z-30 mb-6">
            <form onSubmit={handleSearch} className="sbox glass-panel shadow-premium border-primary/20 flex items-center relative z-20 dark:bg-slate-900/90 dark:border-slate-800">
              <div className="sico text-primary dark:text-emerald-500">
                <Search className="h-5 w-5" />
              </div>
              <input 
                id="sinp" 
                type="text" 
                placeholder={PLACEHOLDERS[placeholderIdx]} 
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="bg-transparent dark:text-white"
              />
              <button type="submit" className="sbtn bg-gradient-to-r from-primary to-secondary dark:from-emerald-600 dark:to-blue-700">Buscar Agora</button>
            </form>

            {/* Suggestions Autocomplete */}
            {showSuggestions && (filteredCats.length > 0 || filteredCids.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-border/80 dark:border-slate-800 rounded-xl shadow-lg z-50 overflow-hidden text-left py-2">
                {filteredCats.length > 0 && (
                  <div className="px-4 py-2 border-b border-border/50 dark:border-slate-800/50">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-amber-500" /> Categorias
                    </span>
                    <div className="mt-1 space-y-1">
                      {filteredCats.map(c => (
                        <button
                          key={c.slug}
                          type="button"
                          onMouseDown={() => {
                            setTermoBusca(c.n);
                            navigate(`/busca?nicho=${encodeURIComponent(c.slug)}`);
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2"><span>{c.e}</span> {c.n}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredCids.length > 0 && (
                  <div className="px-4 py-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-primary" /> Cidades
                    </span>
                    <div className="mt-1 space-y-1">
                      {filteredCids.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setTermoBusca(c.nome);
                            navigate(`/busca?q=${encodeURIComponent(c.nome)}`);
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                        >
                          <span>📍 {c.nome} - {c.uf}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Simulated Activity Ticker */}
          <div className="mb-8 inline-flex items-center justify-center">
            <div className="glass-panel text-xs md:text-sm px-4 py-2 rounded-full border border-primary/10 shadow-sm flex items-center gap-2 text-primary dark:text-emerald-400 font-semibold animate-pulse-slow dark:bg-slate-900/60 dark:border-slate-800">
              <Bell className="h-4 w-4 animate-bounce text-amber-500" />
              <span className="text-muted-foreground font-normal">Atividade recente:</span>
              <span className="inline-flex items-center gap-1 text-slate-800 dark:text-emerald-300">
                <span>{SIMULATED_ACTIVITIES[currentActivityIdx].emoji}</span>
                <span>{SIMULATED_ACTIVITIES[currentActivityIdx].txt}</span>
              </span>
            </div>
          </div>

          <div className="stags">
            <span className="stag">Buscas comuns:</span>
            <span className="stag"><Link to="/busca?q=Estética">Estética</Link></span>
            <span className="stag" style={{ color: '#ddd' }}>·</span>
            <span className="stag"><Link to="/busca?q=Pet%20Shop">Pet Shop</Link></span>
            <span className="stag" style={{ color: '#ddd' }}>·</span>
            <span className="stag"><Link to="/busca?q=Disk%20Gás">Disk Gás</Link></span>
            <span className="stag" style={{ color: '#ddd' }}>·</span>
            <span className="stag"><Link to="/busca?q=Advogado">Advogado</Link></span>
            <span className="stag" style={{ color: '#ddd' }}>·</span>
            <span className="stag"><Link to="/busca?q=Mecânica">Mecânica</Link></span>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mq-wrap">
        <div className="mq-inner">
          {doubleMqCities.map((item, idx) => {
            const parts = item.split(' · ');
            return (
              <span key={idx} className="mqi">
                <span className="mqd"></span>
                <span className="mqc">{parts[0]}</span>&nbsp;·&nbsp;{parts[1]}
              </span>
            );
          })}
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="st">
          <div className="st-n"><em>{counters.empresas}</em>+</div>
          <div className="st-l">EMPRESAS CADASTRADAS</div>
        </div>
        <div className="st">
          <div className="st-n"><em>{counters.cidades}</em>+</div>
          <div className="st-l">CIDADES ATENDIDAS</div>
        </div>
        <div className="st">
          <div className="st-n"><em>{counters.estados}</em>+</div>
          <div className="st-l">ESTADOS COBERTOS</div>
        </div>
        <div className="st">
          <div className="st-n"><em>{counters.premium}</em>+</div>
          <div className="st-l">MEMBROS PREMIUM</div>
        </div>
      </div>

      {/* CATEGORIAS */}
      <section className="sec sec-alt">
        <div className="seh c">
          <div className="seeye">NAVEGUE POR NICHO</div>
          <div className="setit">Explore por <span>Categoria</span></div>
          <div className="sesub">Encontre exatamente o que você precisa em segundos</div>
        </div>
        <div className="cats">
          {CATS.map((c, idx) => (
            <div 
              key={idx} 
              className="cat" 
              onClick={() => navigate(`/busca?nicho=${encodeURIComponent(c.slug)}`)}
            >
              <div className="catic" style={{ background: c.bg }}>
                <span>{c.e}</span>
              </div>
              <div className="catnm">{c.n}</div>
              <div className="catct">{getCatCount(c.slug)} empresas</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROTATING EVIDENCE BANNER */}
      {banners.length > 0 && (
        <section className="banner-sec">
          <div className="serow" style={{ padding: '0 0 4px' }}>
            <div>
              <div className="setit">Empresas em <span>Evidência</span></div>
            </div>
            <Link className="selink" to="/cadastro">
              Anunciar aqui 
              <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="banner-big" onClick={() => banners[bannerIdx].slug && navigate(`/empresa/${banners[bannerIdx].slug}`)}>
            <div 
              className="banner-bg" 
              style={
                banners[bannerIdx].bgImg 
                  ? { background: `url(${banners[bannerIdx].bgImg}) center/cover no-repeat` } 
                  : { background: banners[bannerIdx].g }
              }
            ></div>
            <div 
              className="banner-overlay" 
              style={
                banners[bannerIdx].bgImg 
                  ? { background: 'linear-gradient(90deg,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0) 70%)' } 
                  : { background: 'linear-gradient(90deg,rgba(0,0,0,0.3),transparent)' }
              }
            ></div>
            <div className="banner-content">
              <span className="banner-tag" style={banners[bannerIdx].bgImg ? { background: 'var(--g)', color: '#fff', border: 'none' } : undefined}>
                {banners[bannerIdx].tag}
              </span>
              <div className="banner-h" style={banners[bannerIdx].bgImg ? { textShadow: '0 2px 10px rgba(0,0,0,0.6)' } : undefined}>
                {banners[bannerIdx].h}
              </div>
              <div className="banner-sub" style={banners[bannerIdx].bgImg ? { textShadow: '0 2px 8px rgba(0,0,0,0.6)' } : undefined}>
                {banners[bannerIdx].sub}
              </div>
            </div>
            {!banners[bannerIdx].bgImg && (
              <div className="banner-logo">{banners[bannerIdx].e}</div>
            )}
            <div className="banner-cta" onClick={(e) => e.stopPropagation()}>
              <a href={`https://wa.me/${banners[bannerIdx].wa}`} target="_blank" rel="noopener noreferrer">
                <button className="banner-btn">
                  {banners[bannerIdx].btn || 'Falar no WhatsApp'} →
                </button>
              </a>
            </div>
          </div>
          <div className="banner-dots" style={{ position: 'relative', right: 'auto', bottom: 'auto', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {banners.map((_, i) => (
              <div 
                key={i} 
                className={`bdot ${i === bannerIdx ? 'on' : ''}`} 
                onClick={() => setBannerIdx(i)}
              ></div>
            ))}
          </div>
        </section>
      )}

      {/* DESTAQUES FIXOS */}
      <section className="sec sec-bg2">
        <div className="dest-header">
          <div>
            <div className="setit">Empresas em <span>Destaque</span></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="dest-badge">⭐ DESTAQUE PREMIUM</span>
          </div>
        </div>
        
        <div className="dest-grid">
          {empresasDestaque.length > 0 ? (
            empresasDestaque.map(emp => renderCard(emp))
          ) : (
            <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '40px', color: 'var(--muted)', fontWeight: 'bold' }}>
              Carregando destaques...
            </div>
          )}
        </div>
      </section>

      {/* GRANDES MARCAS */}
      <section className="sec sec-alt">
        <div className="seh c">
          <div className="setit">Grandes <span>Marcas</span></div>
          <div className="sesub">As maiores empresas de cada cidade com presença verificada no Guia Local BR</div>
        </div>
        <div className="marcas-wrap">
          <div className="marcas-track">
            {doubleMarcas.map((m, idx) => (
              <div key={idx} className="mc" onClick={() => m.slug && navigate(`/empresa/${m.slug}`)}>
                <div className="mc-logo" style={{ background: m.bg }}>
                  {m.e}
                </div>
                <div className="mc-name">{m.n}</div>
                <div className="mc-cat">{m.cat}</div>
                <div className="mc-city">{m.c}</div>
                <div className="mc-stars">★★★★★</div>
                <div className="mc-verified">✓ VERIFICADO</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CIDADES */}
      <section className="sec sec-bg2">
        <div className="serow">
          <div>
            <div className="setit">Cidades em <span>Destaque</span></div>
          </div>
          <Link className="selink" to="/busca">
            Ver todas as cidades 
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="cid-grid">
          {cidades.map((c, idx) => (
            <div 
              key={idx} 
              className={`cid ${idx === 0 || idx === 3 ? 'big' : ''}`}
              style={
                c.foto 
                  ? { background: `url(${c.foto}) center/cover no-repeat` } 
                  : { background: `linear-gradient(135deg, #0A1628, #1A3A6A)` }
              }
              onClick={() => navigate(`/busca?q=${encodeURIComponent(c.nome)}`)}
            >
              <div className="cid-ov"></div>
              <div className="cid-inf">
                <span className="cidb">{c.count} EMPRESAS</span>
                <div className="cidn">{c.nome} · {c.uf}</div>
                <div className="cidc">Ver empresas →</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BLOG */}
      <section className="sec sec-alt">
        <div className="serow">
          <div>
            <div className="seeye">CONTEÚDO LOCAL</div>
            <div className="setit">Blog & <span>Dicas</span></div>
          </div>
          <Link className="selink" to="/blog">
            Ver tudo 
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="blog-grid">
          {artigos.length > 0 ? (
            artigos.slice(0, 3).map((art, idx) => (
              <div key={art.id} className="bc" onClick={() => navigate(`/blog/artigo/${art.slug}`)}>
                {art.foto_capa ? (
                  <div className={`bc-img ${idx === 0 ? 'big' : 'sm'}`} style={{ background: `url(${art.foto_capa}) center/cover no-repeat` }}></div>
                ) : (
                  <div className={`bc-img ${idx === 0 ? 'big' : 'sm'}`} style={{ background: 'linear-gradient(135deg,#EDF6FF,#C8DCFF)' }}>
                    <span style={{ fontSize: idx === 0 ? '56px' : '40px' }}>📰</span>
                  </div>
                )}
                <span className="bctag" style={{ background: '#EDF6FF', color: '#1A3A8A' }}>
                  {art.categoria?.toUpperCase() || 'DICA'}
                </span>
                <div className="bctit">{art.titulo}</div>
                <div className="bcmeta">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  {new Date(art.publicado_em || art.criado_em).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))
          ) : (
            DEFAULT_POSTS.map((post, idx) => (
              <div key={idx} className="bc" onClick={() => navigate(`/blog`)}>
                <div className={`bc-img ${idx === 0 ? 'big' : 'sm'}`} style={{ background: post.bg }}>
                  <span style={{ fontSize: idx === 0 ? '56px' : '40px' }}>{post.emoji}</span>
                </div>
                <span className="bctag" style={{ background: post.tagBg, color: post.tagColor }}>
                  {post.tag}
                </span>
                <div className="bctit">{post.titulo}</div>
                <div className="bcmeta">
                  <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  {post.meta}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* TODAS/RECENTES EMPRESAS */}
      <section className="sec" style={{ background: 'var(--bg)' }}>
        <div className="serow">
          <div>
            <div className="setit">Empresas <span>Recentes</span></div>
          </div>
          <Link className="selink" to="/busca">
            Ver todas 
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
        <div className="list-grid">
          {empresasRecentes.length > 0 ? (
            empresasRecentes.map(emp => renderCard(emp))
          ) : (
            <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '40px', color: 'var(--muted)', fontWeight: 'bold' }}>
              Carregando empresas recentes...
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="ctar1"></div><div className="ctar2"></div><div className="ctar3"></div>
        <div className="ctai">
          <div className="ctaey">ANUNCIE AGORA</div>
          <h2 className="ctah">Sua empresa ainda não está<br/>listada no <span>Guia Local BR</span>?</h2>
          <p className="ctas">Coloque seu negócio na frente de clientes locais que já estão buscando o que você oferece.</p>
          <div className="ctabtns">
            <button className="ctabp" onClick={() => navigate('/cadastro')}>Cadastrar Empresa Grátis →</button>
            <button className="ctabs" onClick={() => navigate('/cadastro')}>Conhecer o Plano Premium</button>
          </div>
        </div>
      </section>

      {/* PARCEIROS */}
      <div className="par">
        <div>
          <span className="parb">SEJA UM LICENCIADO</span>
          <h2 className="parh">Quer ser o Consultor Exclusivo na sua cidade?</h2>
          <p className="pars">Exclusividade territorial, renda recorrente e suporte completo de uma plataforma de alta tecnologia. Gerencie empresas ilimitadas e venda premium localmente.</p>
        </div>
        <button className="parbtn" onClick={() => window.open('https://wa.me/5535999483143', '_blank')}>
          Falar com o Time →
        </button>
      </div>

      {/* FOOTER */}
      <footer className="ft">
        <div className="ftg">
          <div>
            <div className="ftbrand">Guia Local <b>BR</b></div>
            <p className="ftdesc">O maior buscador de negócios locais do Brasil. Conectando pessoas e oportunidades em todo território nacional.</p>
          </div>
          <div>
            <div className="ftct">ATALHOS</div>
            <Link className="ftl" to="/sobre">Sobre Nós</Link>
            <Link className="ftl" to="/blog">Nosso Blog</Link>
            <Link className="ftl" to="/busca">Categorias</Link>
            <Link className="ftl" to="/busca">Cidades</Link>
            <Link className="ftl" to="/admin">Baixar Planilha (.xlsx)</Link>
          </div>
          <div>
            <div className="ftct">PARCERIAS</div>
            <Link className="ftl" to="/cadastro">Anunciar Negócio</Link>
            <Link className="ftl" to="/parceiro">Seja um Parceiro</Link>
            <Link className="ftl" to="/cadastro">Planos e Preços</Link>
            <Link className="ftl" to="/parceiro">Programa de Parceiros</Link>
          </div>
          <div>
            <div className="ftct">INSTITUCIONAL</div>
            <Link className="ftl" to="/privacidade">Política de Privacidade</Link>
            <Link className="ftl" to="/termos">Termos de Uso</Link>
            <Link className="ftl" to="/contato">Contato</Link>
          </div>
        </div>
        <div className="ftbot">
          <span className="ftcopy">© 2026 Guia Local BR · Todos os direitos reservados</span>
          <span className="ftcopy">Desenvolvido com tecnologia de ponta</span>
        </div>
      </footer>

    </div>
  );
}
