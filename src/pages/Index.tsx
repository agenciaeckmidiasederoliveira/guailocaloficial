import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

const EMP=[
  {n:"Evolution Car - Guincho 24h",c:"Sarandi",u:"PR",p:"premium",e:"🚗",cat:"Automotivo",bg:"#EBF5FF"},
  {n:"Alkazar Disk Pizza",c:"Paiçandu",u:"PR",p:"premium",e:"🍕",cat:"Alimentação",bg:"#FFF3E0"},
  {n:"Rachid Odontologia",c:"Maringá",u:"PR",p:"premium",e:"🦷",cat:"Saúde",bg:"#F0EEFF"},
  {n:"Leila Cristiane Micropigmentação",c:"Maringá",u:"PR",p:"premium",e:"✨",cat:"Beleza",bg:"#FEE8F2"},
  {n:"di Domenico Casa",c:"Maringá",u:"PR",p:"premium",e:"🏠",cat:"Decoração",bg:"#E8F8F2"},
  {n:"Maringá Gás",c:"Maringá",u:"PR",p:"premium",e:"🔥",cat:"Disk Gás",bg:"#FFFAE0"},
  {n:"Facini Coffe Beer",c:"Paiçandu",u:"PR",p:"premium",e:"☕",cat:"Alimentação",bg:"#FFF3E0"},
  {n:"Zacanini Bebidas",c:"Paiçandu",u:"PR",p:"premium",e:"🍺",cat:"Bebidas",bg:"#FFFBE0"},
  {n:"Supermercado Iguaçu",c:"Maringá",u:"PR",p:"premium",e:"🛒",cat:"Supermercado",bg:"#E4F6EE"},
  {n:"Casa de Carnes Itaipu",c:"Maringá",u:"PR",p:"premium",e:"🥩",cat:"Alimentação",bg:"#FFEEE0"},
  {n:"Viva Gás Maringá",c:"Maringá",u:"PR",p:"premium",e:"🔥",cat:"Disk Gás",bg:"#FFFAE0"},
  {n:"Studio Izidoro Norbiato",c:"Paiçandu",u:"PR",p:"premium",e:"💇",cat:"Beleza",bg:"#FEE8F2"},
  {n:"Renova Car Estética",c:"Paiçandu",u:"PR",p:"premium",e:"🚘",cat:"Automotivo",bg:"#EBF5FF"},
  {n:"Rede Guanabara Gás",c:"Paiçandu",u:"PR",p:"premium",e:"🔥",cat:"Disk Gás",bg:"#FFFAE0"},
  {n:"Pioneiro Pneus Borracharia",c:"Paiçandu",u:"PR",p:"premium",e:"🛞",cat:"Automotivo",bg:"#EBF5FF"},
  {n:"Mercado 2 Irmãos",c:"Paiçandu",u:"PR",p:"premium",e:"🛒",cat:"Supermercado",bg:"#E4F6EE"},
  {n:"LOT Premium Shop",c:"Paiçandu",u:"PR",p:"premium",e:"👗",cat:"Moda",bg:"#F5EEFF"},
  {n:"Fuskão Lanches",c:"Paiçandu",u:"PR",p:"premium",e:"🍔",cat:"Alimentação",bg:"#FFF3E0"},
  {n:"Disk Chopp Deley",c:"Paiçandu",u:"PR",p:"premium",e:"🍻",cat:"Bebidas",bg:"#FFFBE0"},
  {n:"Chef Vinicius Pires",c:"Maringá",u:"PR",p:"premium",e:"👨🍳",cat:"Gastronomia",bg:"#FFF0E0"},
  {n:"RGG Conveniência",c:"Paiçandu",u:"PR",p:"premium",e:"🏪",cat:"Conveniência",bg:"#E4F6EE"},
  {n:"Marquesone Tintas",c:"Paiçandu",u:"PR",p:"premium",e:"🎨",cat:"Construção",bg:"#EEEEFF"},
  {n:"Depósito Marquesone",c:"Paiçandu",u:"PR",p:"premium",e:"🏗️",cat:"Construção",bg:"#EEEEFF"},
  {n:"Restaurante da Déia",c:"Pouso Alegre",u:"MG",p:"premium",e:"🍽️",cat:"Alimentação",bg:"#FFF3E0"},
  {n:"ANA SHOES PVA",c:"Primavera do Leste",u:"MT",p:"premium",e:"👠",cat:"Moda",bg:"#F5EEFF"},
  {n:"Credcasa",c:"Vilhena",u:"RO",p:"premium",e:"🏡",cat:"Imóveis",bg:"#E8F8F2"},
  {n:"Sirleia Souza Estética",c:"Ilhéus",u:"BA",p:"premium",e:"💆",cat:"Beleza",bg:"#FEE8F2"},
  {n:"Pequerrucha Laços e Mimos",c:"Pouso Alegre",u:"MG",p:"premium",e:"🎀",cat:"Artesanato",bg:"#FFEEF6"},
  {n:"Lavihê Carrinho Gourmet",c:"Pouso Alegre",u:"MG",p:"premium",e:"🍰",cat:"Gastronomia",bg:"#FFF0E0"},
  {n:"Ateliê Mãe e Filha",c:"Nova Odessa",u:"SP",p:"premium",e:"🧵",cat:"Artesanato",bg:"#FFEEF6"},
  {n:"Ousia Estética Corporal",c:"Pouso Alegre",u:"MG",p:"premium",e:"💅",cat:"Beleza",bg:"#FEE8F2"},
  {n:"Flor Estética Dai",c:"Araraquara",u:"SP",p:"premium",e:"🌸",cat:"Beleza",bg:"#FEE8F2"},
  {n:"Eder Oliveira Estrategista",c:"Pouso Alegre",u:"MG",p:"premium",e:"📈",cat:"Marketing",bg:"#EBF5FF"},
  {n:"Mercado Hortifruti Molina",c:"Maringá",u:"PR",p:"premium",e:"🥦",cat:"Supermercado",bg:"#E4F6EE"},
  {n:"Conexo Seg. Medicina",c:"Vila Velha",u:"ES",p:"free",e:"🏥",cat:"Saúde",bg:"#F0EEFF"},
  {n:"Almeida Entregas",c:"Petrópolis",u:"RJ",p:"free",e:"📦",cat:"Logística",bg:"#EBF5FF"},
  {n:"MR Clínica de Estética",c:"Curitiba",u:"PR",p:"free",e:"💆",cat:"Beleza",bg:"#FEE8F2"},
  {n:"Alexandre Haddad Advogado",c:"Nova Aurora",u:"PR",p:"free",e:"⚖️",cat:"Jurídico",bg:"#EEEEFF"},
  {n:"Top Dog Clínica Vet",c:"Pouso Alegre",u:"MG",p:"free",e:"🐶",cat:"Pet Shop",bg:"#E8F8F2"},
  {n:"Digisat Antenas",c:"Pouso Alegre",u:"MG",p:"free",e:"📡",cat:"Tecnologia",bg:"#EBF5FF"},
  {n:"Mineirinho Pet",c:"Alfenas",u:"MG",p:"free",e:"🐾",cat:"Pet Shop",bg:"#E8F8F2"},
  {n:"Chinchila Queens Pets",c:"Pouso Alegre",u:"MG",p:"free",e:"🐰",cat:"Pet Shop",bg:"#E8F8F2"},
  {n:"Auto Socorro Jacaré",c:"Pouso Alegre",u:"MG",p:"free",e:"🚐",cat:"Automotivo",bg:"#EBF5FF"},
  {n:"Lava Rápido Stock Car",c:"Americana",u:"SP",p:"free",e:"🚿",cat:"Automotivo",bg:"#EBF5FF"},
  {n:"RK Facas e Acessórios",c:"S.J. dos Pinhais",u:"PR",p:"free",e:"🔪",cat:"Comércio",bg:"#E4F6EE"},
  {n:"Farmácia Brasil Poupa Lar",c:"S.J. dos Pinhais",u:"PR",p:"free",e:"💊",cat:"Farmácia",bg:"#F0EEFF"},
  {n:"Ampliato Beleza Cuiabá",c:"Cuiabá",u:"MT",p:"free",e:"💄",cat:"Beleza",bg:"#FEE8F2"},
  {n:"EVS Espaço Vida Saudável",c:"Curitiba",u:"PR",p:"free",e:"🥤",cat:"Saúde",bg:"#E8F8F2"},
  {n:"CF Carrinhos Gourmet",c:"Cotia",u:"SP",p:"free",e:"🛒",cat:"Gastronomia",bg:"#FFF0E0"}
];

const CATS=[
  {n:"Alimentação",e:"🍽️",bg:"#FFF3E0",c:"#E07B00"},
  {n:"Beleza e Estética",e:"💆",bg:"#FEE8F2",c:"#C2185B"},
  {n:"Automotivo",e:"🚗",bg:"#EBF5FF",c:"#1565C0"},
  {n:"Saúde",e:"🏥",bg:"#F0EEFF",c:"#512DA8"},
  {n:"Pet Shop",e:"🐾",bg:"#E8F8F2",c:"#2E7D32"},
  {n:"Disk Gás",e:"🔥",bg:"#FFFAE0",c:"#E65100"},
  {n:"Jurídico",e:"⚖️",bg:"#EEEEFF",c:"#311B92"},
  {n:"Tecnologia",e:"💻",bg:"#EBF5FF",c:"#0D47A1"},
  {n:"Moda",e:"👗",bg:"#F5EEFF",c:"#6A1B9A"},
  {n:"Decoração",e:"🏠",bg:"#E8F8F2",c:"#00695C"},
  {n:"Construção",e:"🏗️",bg:"#EEEEFF",c:"#283593"},
  {n:"Supermercado",e:"🛒",bg:"#E4F6EE",c:"#1B5E20"},
  {n:"Serviços",e:"🛠️",bg:"#F0F4C3",c:"#827717"},
  {n:"Educação",e:"📚",bg:"#E1F5FE",c:"#0277BD"},
  {n:"Imóveis",e:"🏡",bg:"#F3E5F5",c:"#4A148C"},
  {n:"Eventos",e:"🎉",bg:"#FFF8E1",c:"#F57F17"}
];

const BANNERS=[
  {tag:"PAIÇANDU · PR",h:"Alkazar Disk Pizza",sub:"A pizza mais pedida de Paiçandu. Delivery rápido, sabor garantido!",e:"🍕",g:"linear-gradient(135deg,#7B2D00,#D4520A)",btn:"Pedir Agora"},
  {tag:"MARINGÁ · PR",h:"Rachid Odontologia",sub:"Sorria com confiança. Clareamento, implantes e ortodontia em Maringá.",e:"🦷",g:"linear-gradient(135deg,#0A1E50,#1A5CB5)",btn:"Agendar Consulta"},
  {tag:"MARINGÁ · PR",h:"di Domenico Casa",sub:"Decoração de alto padrão. Transforme seu lar com elegância e estilo.",e:"🏠",g:"linear-gradient(135deg,#0A2E1E,#1A7A4A)",btn:"Conhecer Loja"},
  {tag:"PAIÇANDU · PR",h:"Evolution Car Guincho 24h",sub:"Guincho rápido 24 horas. Centro automotivo completo em Sarandi/PR.",e:"🚗",g:"linear-gradient(135deg,#1A0A2E,#5A1AA0)",btn:"Chamar Agora"},
  {tag:"MARINGÁ · PR",h:"Viva Gás Maringá",sub:"Entrega de gás em até 30 minutos. Atendemos toda a região de Maringá.",e:"🔥",g:"linear-gradient(135deg,#2E1A00,#A05A00)",btn:"Pedir Gás"},
  {tag:"POUSO ALEGRE · MG",h:"Restaurante da Déia",sub:"A culinária mineira mais autêntica de Pouso Alegre. Venha se deliciar!",e:"🍽️",g:"linear-gradient(135deg,#1A2E0A,#3A7A1A)",btn:"Ver Cardápio"}
];

const MARCAS=[
  {n:"Supermercado Iguaçu",cat:"Supermercado",c:"Maringá · PR",e:"🛒",bg:"#E4F6EE"},
  {n:"Rachid Odontologia",cat:"Odontologia",c:"Maringá · PR",e:"🦷",bg:"#F0EEFF"},
  {n:"di Domenico Casa",cat:"Casa & Decoração",c:"Maringá · PR",e:"🏠",bg:"#E8F8F2"},
  {n:"Evolution Car",cat:"Centro Automotivo",c:"Sarandi · PR",e:"🚗",bg:"#EBF5FF"}
];

const CIDS=[
  {n:"Paiçandu",u:"PR",ct:18,big:true,bg:"#0A2E1E"},
  {n:"Maringá",u:"PR",ct:11,bg:"#0A1E50"},
  {n:"Pouso Alegre",u:"MG",ct:8,bg:"#1A104A"},
  {n:"Curitiba",u:"PR",ct:3,bg:"#0A2A1A"},
  {n:"Sarandi",u:"PR",ct:1,bg:"#1A2A0A"},
  {n:"Ilhéus",u:"BA",ct:1,bg:"#2A100A"},
  {n:"Vila Velha",u:"ES",ct:1,bg:"#0A1A3A"},
  {n:"Petrópolis",u:"RJ",ct:1,bg:"#2A1A0A"}
];

const MQ=[..."Maringá · PR,Paiçandu · PR,Sarandi · PR,Curitiba · PR,Vila Velha · ES,Petrópolis · RJ,Cuiabá · MT,Ilhéus · BA,Vilhena · RO,Nova Aurora · PR,Araraquara · SP,Alfenas · MG,Cotia · SP,Americana · SP,Nova Odessa · SP,Primavera do Leste · MT,S.J. dos Pinhais · PR,Pouso Alegre · MG,Campo Mourão · PR,Londrina · PR".split(",")];

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Intercept clicks on links for SPA navigation
    const handleLinkClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a');
      if (a && a.hasAttribute('href')) {
        const href = a.getAttribute('href')!;
        if (href.startsWith('/') && !href.startsWith('http')) {
          e.preventDefault();
          navigate(href);
          window.scrollTo(0, 0);
        }
      }
    };
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [navigate]);

  useEffect(() => {
    // MARQUEE
    const mqEl = document.getElementById('mq');
    if(mqEl) {
      mqEl.innerHTML=[...MQ,...MQ].map(c=>`<span class="mqi"><span class="mqd"></span><span class="mqc">${c.split(' · ')[0]}</span>&nbsp;·&nbsp;${c.split(' · ')[1]}</span>`).join('');
    }

    // COUNTUP
    function countUp(id: string, target: number){
      const el=document.getElementById(id);
      if(!el) return;
      let v=0,step=target/60;
      const t=setInterval(()=>{v=Math.min(v+step,target);el.textContent=Math.round(v).toString();if(v>=target)clearInterval(t);},1400/60);
    }
    const sobs=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting){countUp('n1',49);countUp('n2',20);countUp('n3',10);countUp('n4',34);sobs.disconnect();}
    },{threshold:0.3});
    const statsEl = document.querySelector('.stats');
    if(statsEl) sobs.observe(statsEl);

    // PLACEHOLDER ROTATIVO
    const phs=["Pizzaria em Maringá...","Mecânico em Paiçandu...","Dentista em Curitiba...","Pet Shop em Pouso Alegre...","Advogado em Nova Aurora...","Disk Gás em Maringá...","Estética em Ilhéus..."];
    let pi=0;const inp=document.getElementById('sinp');
    let phTimer: any;
    if(inp) {
      phTimer = setInterval(()=>{pi=(pi+1)%phs.length;inp.style.opacity='0';setTimeout(()=>{if(inp){(inp as HTMLInputElement).placeholder=phs[pi];inp.style.opacity='1';}},230);},3200);
      inp.style.transition='opacity .23s';
    }

    // CATS
    const catsEl=document.getElementById('cats');
    if(catsEl) {
      catsEl.innerHTML = '';
      CATS.forEach(c=>{
        const cnt=EMP.filter(e=>e.cat===c.n).length||Math.floor(Math.random()*8+3);
        catsEl.innerHTML+=`<div class="cat"><div class="catic" style="background:${c.bg}"><span>${c.e}</span></div><div class="catnm">${c.n}</div><div class="catct">${cnt} empresas</div></div>`;
      });
    }

    // BANNERS
    let bIdx=0;
    let banTimer: any;
    let currentBanners: any[] = [...BANNERS];
    
    function buildBanners(){
      const bc=document.getElementById('banner-container');
      const bd=document.getElementById('bdots');
      if(!bc || !bd) return;
      bc.innerHTML='';
      currentBanners.forEach((b,i)=>{
        bc.innerHTML+=`<div class="banner-big" style="display:${i===bIdx?'flex':'none'}" id="ban${i}">
          <div class="banner-bg" style="${b.bgImg ? `background:url(${b.bgImg}) center/cover no-repeat` : `background:${b.g}`}"></div>
          <div class="banner-overlay" style="${b.bgImg ? 'background:linear-gradient(90deg,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0) 70%)' : 'background:linear-gradient(90deg,rgba(0,0,0,0.3),transparent)'}"></div>
          <div class="banner-content">
            <span class="banner-tag" style="${b.bgImg ? 'background:var(--g);color:#fff;border:none' : ''}">${b.tag}</span>
            <div class="banner-h" style="${b.bgImg ? 'text-shadow:0 2px 10px rgba(0,0,0,0.6)' : ''}">${b.h}</div>
            <div class="banner-sub" style="${b.bgImg ? 'text-shadow:0 2px 8px rgba(0,0,0,0.6)' : ''}">${b.sub}</div>
          </div>
          ${!b.bgImg ? `<div class="banner-logo">${b.e}</div>` : ''}
          <div class="banner-cta" style="z-index:3"><a href="${b.waLink||'#'}" target="_blank" style="text-decoration:none"><button class="banner-btn">${b.btn||'Falar no WhatsApp'} →</button></a></div>
        </div>`;
      });
      bd.innerHTML=currentBanners.map((_,i)=>`<div class="bdot${i===bIdx?' on':''}" data-i="${i}"></div>`).join('');
      
      document.querySelectorAll('.bdot').forEach(el => {
        el.addEventListener('click', (e) => {
          goBan(parseInt((e.target as HTMLElement).getAttribute('data-i')||'0'));
        });
      });
    }
    function goBan(i: number){
      document.querySelectorAll('.banner-big').forEach((el,j)=>(el as HTMLElement).style.display=j===i?'flex':'none');
      document.querySelectorAll('.bdot').forEach((d,j)=>{d.classList.toggle('on',j===i);});
      bIdx=i;
    }
    buildBanners();
    banTimer = setInterval(()=>goBan((bIdx+1)%currentBanners.length),5000);

    // DESTAQUES FIXOS EM GRID COM DADOS REAIS DO SUPABASE E NOVO DESIGN
    function formatP(p: any){
      if(!p) return '';
      const n = String(p).replace(/\D/g, '');
      if(n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
      if(n.length === 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
      return String(p);
    }
    
    function cardHTML(e: any){
      const waLink = `https://wa.me/55${(e.wa||e.tel||'').replace(/\D/g,'')}`;
      return `<div class="ecard">
        <div class="ecard-top">
          <div class="ebadge-row">
            ${e.p==='premium' ? `<span class="ebadge-prem"><svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2.5"><path d="M2 4h20l-2 16H4zM12 4v16"/><path d="M6 4v16M18 4v16"/></svg> Premium</span>` : '<span></span>'}
            <span class="ebadge-fav"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.9 7.9 7.8-7.9 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></span>
          </div>
          ${e.foto_principal 
            ? `<img src="${e.foto_principal}" alt="${e.n}" class="ecard-img" />`
            : `<div style="font-size:50px">${e.e||'🏢'}</div>`
          }
        </div>
        <div class="ecard-body">
          <div class="ecard-title">${e.n}</div>
          ${e.cat ? `<div class="ecard-tag">${e.cat}</div>` : ''}
          
          ${(e.c && e.u) ? `<div class="ecard-row">
            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${e.c}, ${e.u}
          </div>` : ''}
          <div class="ecard-row">
            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            ${formatP(e.wa || e.tel)}
          </div>
          
          <div class="ecard-div"></div>
          
          <div class="ecard-actions">
            <a href="${waLink}" target="_blank" class="ecard-btn ecard-wa-btn">
              <svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              WhatsApp
            </a>
            ${e.insta ? `
            <a href="${String(e.insta).startsWith('http') ? e.insta : 'https://instagram.com/'+String(e.insta).replace('@','')}" target="_blank" class="ecard-btn ecard-ig-btn" title="Instagram">
              <svg viewBox="0 0 24 24" style="width:16px;height:16px"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>` : ''}
            ${e.fb ? `
            <a href="${String(e.fb).startsWith('http') ? e.fb : 'https://facebook.com/'+e.fb}" target="_blank" class="ecard-btn ecard-fb-btn" title="Facebook">
              <svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>` : ''}
            ${e.site ? `
            <a href="${String(e.site).startsWith('http') ? e.site : 'https://'+e.site}" target="_blank" class="ecard-btn ecard-site-btn" title="Site">
              <svg viewBox="0 0 24 24" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
            </a>` : ''}
          </div>
        </div>
      </div>`;
    }

    async function loadSupabaseData() {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'aprovado')
        .order('plano', { ascending: false })
        .limit(12);

      if (error) console.error("Erro ao buscar empresas:", error);

      if (data && data.length > 0) {
        currentBanners = data.slice(0,3).map(e => ({
          tag: e.cidade && e.estado ? `${e.cidade.toUpperCase()} · ${e.estado.toUpperCase()}` : 'DESTAQUE',
          h: e.nome || 'Empresa',
          sub: e.nicho ? `Especialistas em ${e.nicho} na sua região. Acesse nosso perfil e entre em contato.` : `Conheça nossos produtos e serviços hoje mesmo!`,
          bgImg: e.foto_principal,
          waLink: `https://wa.me/55${String(e.whatsapp||e.telefone||'').replace(/\D/g,'')}`,
          btn: "Falar com Empresa"
        }));
        bIdx = 0;
        buildBanners();
        clearInterval(banTimer);
        banTimer = setInterval(()=>goBan((bIdx+1)%currentBanners.length),5000);
      }

      const destContainer = document.getElementById('dest-grid');
      if (destContainer && data && data.length > 0) {
        destContainer.innerHTML = data.map(p => cardHTML({
          n: p.nome,
          c: p.cidade,
          u: p.estado,
          p: p.plano,
          cat: p.nicho,
          foto_principal: p.foto_principal,
          wa: p.whatsapp,
          tel: p.telefone,
          site: p.site,
          insta: p.instagram,
          fb: p.facebook,
          bg: '#EBF5FF',
          e: '🏢'
        })).join('');
      } else if (destContainer) {
        // Fallback
        const premiums = EMP.filter(e=>e.p==='premium').slice(0,12);
        destContainer.innerHTML = premiums.map(p => cardHTML(p)).join('');
      }

      const listaEl = document.getElementById('lista');
      if (listaEl && data && data.length > 0) {
        listaEl.innerHTML = data.map(p => cardHTML({
          n: p.nome,
          c: p.cidade,
          u: p.estado,
          p: p.plano,
          cat: p.nicho,
          foto_principal: p.foto_principal,
          wa: p.whatsapp,
          tel: p.telefone,
          site: p.site,
          insta: p.instagram,
          fb: p.facebook,
          bg: '#EBF5FF',
          e: '🏢'
        })).join('');
      } else if (listaEl) {
        const fallback = EMP.slice(0,12);
        listaEl.innerHTML = fallback.map(p => cardHTML(p)).join('');
      }

      const marcasEl = document.getElementById('marcas');
      if (marcasEl && data && data.length > 0) {
        const marcasArray = [...data.slice(0,8), ...data.slice(0,8)];
        marcasEl.innerHTML = marcasArray.map(m => `<div class="mc">
          ${m.foto_principal ? `<img src="${m.foto_principal}" class="mc-logo" alt="${m.nome}">` : `<div class="mc-logo" style="background:#f1f5f9">🏢</div>`}
          <div class="mc-name">${m.nome}</div>
          <div class="mc-cat">${m.nicho || 'Geral'}</div>
          <div class="mc-city">${m.cidade}</div>
          <div class="mc-stars">★★★★★</div>
          <div class="mc-verified">✓ VERIFICADO</div>
        </div>`).join('');
      } else if (marcasEl) {
        const fallback = [...MARCAS, ...MARCAS];
        marcasEl.innerHTML = fallback.map(e => `<div class="mc">
          <div class="mc-logo" style="background:${e.bg}">${e.e}</div>
          <div class="ecard-n">${e.n||'Empresa'}</div>
          ${e.cat ? `<div class="ecard-cat">${e.cat}</div>` : ''}
          ${(e.c && e.u) ? `<div class="ecard-meta"><span>📍</span> ${e.c}, ${e.u}</div>` : ''}
          <div class="ecard-meta"><span>📞</span> ${e.tel ? formatP(e.tel) : (e.wa ? formatP(e.wa) : 'Não informado')}</div> 
          <div class="mc-verified">✓ VERIFICADO</div>
        </div>`).join('');
      }
    }
    loadSupabaseData();

    // CIDADES
    const cidsEl=document.getElementById('cids');
    if(cidsEl) {
      cidsEl.innerHTML = '';
      CIDS.forEach(c=>{
        cidsEl.innerHTML+=`<div class="cid${c.big?' big':''}" style="background:${c.bg}">
          <div class="cid-ov"></div>
          <div class="cid-inf"><span class="cidb">${c.ct} EMPRESAS</span><div class="cidn">${c.n} · ${c.u}</div><div class="cidc">Ver empresas →</div></div>
        </div>`;
      });
    }

    // LISTA EMPRESAS FOI MOVIDA PARA DENTRO DE loadSupabaseData()

    return () => {
      clearInterval(phTimer);
      clearInterval(banTimer);
      sobs.disconnect();
    };
  }, []);

  return (
    <div className="guia-v2-container">
      <style dangerouslySetInnerHTML={{ __html: `
:root{
  --g:#1A9B6A;--gd:#0F6B4A;--gl:#E8F8F2;--gm:#C8EAD8;
  --bd:#0A1628;--bm:#1A3A6A;
  --bg:#F4F7FB;--white:#fff;--border:#E2EAF4;
  --tx:#3A4A5E;--muted:#8A9AB2;
  --gold:#F59E0B;--wa:#25D366;
  --r:16px;--rs:10px;
}
.guia-v2-container {
  font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--bd);-webkit-font-smoothing:antialiased;
}
.guia-v2-container * { box-sizing:border-box;margin:0;padding:0 }
.guia-v2-container a { text-decoration:none;color:inherit;cursor:pointer }

/* NAV */
.nav{position:sticky;top:0;z-index:200;background:rgba(255,255,255,0.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 48px;height:66px;display:flex;align-items:center;justify-content:space-between}
.nlogo{display:flex;align-items:center;gap:10px}
.nicon{width:38px;height:38px;background:linear-gradient(135deg,#0C5C3A,#1A9B6A);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(26,155,106,0.3)}
.nbrand{font-family:'Sora',sans-serif;font-size:18px;font-weight:900;letter-spacing:-0.5px}
.nbrand b{color:var(--g)}
.nlinks{display:flex;gap:26px}
.nlink{font-size:13px;font-weight:600;color:var(--muted);transition:color .15s}
.nlink:hover{color:var(--g)}
.nacts{display:flex;gap:10px;align-items:center}
.btn-o{border:2px solid var(--g);color:var(--g);font-size:13px;font-weight:700;padding:8px 20px;border-radius:var(--rs);background:transparent;cursor:pointer;font-family:inherit;transition:all .15s}
.btn-o:hover{background:var(--gl)}
.btn-s{background:var(--g);color:#fff;font-size:13px;font-weight:700;padding:9px 22px;border-radius:var(--rs);border:none;cursor:pointer;font-family:inherit;transition:all .15s;box-shadow:0 4px 14px rgba(26,155,106,0.3)}
.btn-s:hover{background:var(--gd)}

/* HERO */
.hero{background:linear-gradient(158deg,#EBF4FF 0%,#E2F7EE 40%,#EBF4FF 100%);padding:80px 48px 68px;text-align:center;position:relative;overflow:hidden}
.hero-grid{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(26,155,106,0.15) 1.5px,transparent 1.5px);background-size:32px 32px;pointer-events:none}
.hero-glow{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,106,0.08),transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
.hero-inner{position:relative;z-index:1;max-width:800px;margin:0 auto}
.hbadge{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1.5px solid var(--gm);border-radius:40px;padding:7px 18px;font-size:11px;font-weight:800;color:var(--gd);letter-spacing:1px;margin-bottom:26px;box-shadow:0 4px 16px rgba(26,155,106,0.1)}
.hdot{width:8px;height:8px;background:var(--g);border-radius:50%;animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
.hero h1{font-family:'Sora',sans-serif;font-size:58px;font-weight:900;line-height:1.04;letter-spacing:-2.5px;color:var(--bd);margin-bottom:20px}
.grad{background:linear-gradient(135deg,#1A9B6A 0%,#0B70D4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-size:17px;color:var(--tx);line-height:1.65;max-width:520px;margin:0 auto 36px;font-weight:400}
.sbox{background:#fff;border-radius:18px;border:2px solid var(--gm);box-shadow:0 8px 40px rgba(26,155,106,0.15);padding:8px 8px 8px 22px;display:flex;align-items:center;gap:10px;max-width:640px;margin:0 auto 20px;transition:border-color .2s}
.sbox:focus-within{border-color:var(--g)}
.sico{flex-shrink:0;color:var(--g);display:flex}
.sico svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
#sinp{flex:1;border:none;outline:none;font-size:15px;font-family:'Plus Jakarta Sans',sans-serif;color:var(--bd);background:transparent;padding:8px 0;transition:opacity .25s}
#sinp::placeholder{color:var(--muted)}
.sbtn{background:linear-gradient(135deg,#1A9B6A,#0B6ECC);color:#fff;font-size:14px;font-weight:800;padding:14px 28px;border-radius:13px;border:none;cursor:pointer;white-space:nowrap;font-family:inherit;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(26,155,106,0.3);transition:opacity .15s}
.sbtn:hover{opacity:.9}
.stags{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.stag{font-size:12px;color:var(--muted);font-weight:500}
.stag a{color:var(--g);font-weight:700}

/* MARQUEE */
.mq-wrap{background:#fff;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:13px 0;overflow:hidden;position:relative}
.mq-wrap::before,.mq-wrap::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none}
.mq-wrap::before{left:0;background:linear-gradient(90deg,#F8FAFC,transparent)}
.mq-wrap::after{right:0;background:linear-gradient(-90deg,#F8FAFC,transparent)}
.mq-inner{display:flex;white-space:nowrap;width:max-content;animation:mqScroll 25s linear infinite}
@keyframes mqScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.mqi{display:inline-flex;align-items:center;gap:7px;padding:0 24px;font-size:12px;font-weight:700;color:var(--tx);border-right:1px solid var(--border)}
.mqd{width:7px;height:7px;background:var(--g);border-radius:50%;flex-shrink:0;animation:pulse 2s ease-in-out infinite}
.mqc{color:var(--bd)}

/* STATS */
.stats{background:#fff;display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border)}
.st{text-align:center;padding:22px 16px;border-right:1px solid var(--border);position:relative;overflow:hidden}
.st:last-child{border-right:none}
.st::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(26,155,106,0.03));pointer-events:none}
.st-n{font-family:'Sora',sans-serif;font-size:34px;font-weight:900;color:var(--bd);line-height:1}
.st-n em{color:var(--g);font-style:normal}
.st-l{font-size:11px;font-weight:700;color:var(--muted);margin-top:5px;letter-spacing:0.5px}

/* SECTION */
.sec{padding:56px 48px}
.sec-alt{background:#fff}
.sec-bg2{background:linear-gradient(180deg,#EBF5FF 0%,var(--bg) 100%)}
.seh{margin-bottom:32px}
.seh.c{text-align:center}
.seeye{font-size:11px;font-weight:800;color:var(--g);letter-spacing:1.5px;margin-bottom:8px}
.setit{font-family:'Sora',sans-serif;font-size:28px;font-weight:900;color:var(--bd);letter-spacing:-0.6px;line-height:1.15}
.setit span{color:var(--g)}
.sesub{font-size:13px;color:var(--muted);margin-top:6px;font-weight:500}
.serow{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:28px}
.selink{font-size:13px;font-weight:700;color:var(--g);display:flex;align-items:center;gap:4px}
.selink svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}

/* CATS */
.cats{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}
.cat{background:#fff;border:2px solid var(--border);border-radius:var(--r);padding:20px 10px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
.cat::before{content:'';position:absolute;inset:0;opacity:0;transition:opacity .2s;background:linear-gradient(135deg,rgba(26,155,106,0.04),transparent)}
.cat:hover{border-color:var(--g);transform:translateY(-4px);box-shadow:0 10px 28px rgba(26,155,106,0.13)}
.cat:hover::before{opacity:1}
.catic{width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin:0 auto 11px;font-size:24px}
.catnm{font-size:11px;font-weight:800;color:var(--bd);line-height:1.2}
.catct{font-size:10px;color:var(--muted);margin-top:3px;font-weight:600}

/* BANNER GRANDE */
.banner-sec{padding:0 48px 56px}
.banner-big{border-radius:22px;overflow:hidden;position:relative;height:320px;display:flex;align-items:center;padding:50px 64px;cursor:pointer;transition:transform .2s}
.banner-big:hover{transform:scale(1.005)}
.banner-bg{position:absolute;inset:0;z-index:0}
.banner-overlay{position:absolute;inset:0;z-index:1}
.banner-content{position:relative;z-index:2;flex:1}
.banner-tag{display:inline-block;background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);color:#fff;font-size:11px;font-weight:800;padding:6px 14px;border-radius:8px;margin-bottom:16px;letter-spacing:1px;border:1px solid rgba(255,255,255,0.3)}
.banner-h{font-family:'Sora',sans-serif;font-size:38px;font-weight:900;color:#fff;letter-spacing:-0.8px;line-height:1.15;margin-bottom:12px}
.banner-sub{font-size:16px;color:rgba(255,255,255,.8);font-weight:500;max-width:440px}
.banner-cta{position:relative;z-index:2;flex-shrink:0;margin-left:40px}
.banner-btn{background:#fff;color:var(--bd);font-size:15px;font-weight:800;padding:16px 32px;border-radius:12px;border:none;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap}
.banner-logo{position:relative;z-index:2;flex-shrink:0;margin-left:50px;width:140px;height:140px;border-radius:24px;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:70px}
.banner-dots{position:absolute;bottom:16px;right:56px;display:flex;gap:6px;z-index:3}
.bdot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.35);transition:all .3s;cursor:pointer}
.bdot.on{background:#fff;width:20px;border-radius:4px}

/* DESTAQUES FIXOS E CARDS PREMIUM */
.dest-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 24px; }
.dest-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.dest-badge{background:var(--gold);color:#fff;font-size:11px;font-weight:800;padding:6px 14px;border-radius:8px;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(245,158,11,0.2)}

/* CARD EMPRESA (NOVO DESIGN) */
.ecard{background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;position:relative;box-shadow:0 4px 14px rgba(0,0,0,0.03)}
.ecard:hover{border-color:#CBD5E1;box-shadow:0 8px 24px rgba(0,0,0,0.08);transform:translateY(-4px)}
.ecard-top{height:220px;background:#F8FAFC;position:relative;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #F1F5F9}
.ecard-img{width:100%;height:100%;object-fit:cover}

.ebadge-row{position:absolute;top:12px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:flex-start;z-index:2}
.ebadge-prem{background:var(--gold);color:#fff;font-size:11px;font-weight:800;padding:5px 12px;border-radius:20px;display:inline-flex;align-items:center;gap:4px;box-shadow:0 4px 10px rgba(245,158,11,0.3)}
.ebadge-fav{width:32px;height:32px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#64748B;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:color .2s}
.ebadge-fav:hover{color:#EF4444}

.ecard-body{padding:16px;display:flex;flex-direction:column;flex:1}
.ecard-title{font-size:17px;font-weight:700;color:#0F172A;margin-bottom:8px;line-height:1.2}
.ecard-tag{display:inline-block;background:#F1F5F9;color:#475569;font-size:11px;font-weight:600;padding:4px 10px;border-radius:12px;margin-bottom:12px;align-self:flex-start}

.ecard-row{display:flex;align-items:center;gap:8px;color:#64748B;font-size:13px;margin-bottom:8px;font-weight:500}
.ecard-row svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;flex-shrink:0}

.ecard-div{height:1px;background:#E2E8F0;margin:12px 0}

.ecard-actions{display:flex;gap:6px}
.ecard-btn{display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;font-weight:700;padding:0;height:38px;border-radius:8px;transition:all .2s;text-decoration:none}
.ecard-btn svg{stroke:currentColor;fill:none;stroke-width:2.2}

.ecard-wa-btn{flex:1;background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0}
.ecard-wa-btn:hover{background:#25D366;color:#fff;border-color:#25D366}

.ecard-ig-btn{width:38px;flex-shrink:0;background:#FDF2F8;color:#DB2777;border:1px solid #FBCFE8}
.ecard-ig-btn:hover{background:linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);color:#fff;border-color:transparent}

.ecard-fb-btn{width:38px;flex-shrink:0;background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE}
.ecard-fb-btn:hover{background:#1877F2;color:#fff;border-color:#1877F2}

.ecard-site-btn{width:38px;flex-shrink:0;background:#F8FAFC;color:#475569;border:1px solid #E2E8F0}
.ecard-site-btn:hover{background:#334155;color:#fff;border-color:#334155}

/* GRANDES MARCAS */
.marcas-wrap{overflow:hidden;position:relative;width:100%;padding:4px 0}
.marcas-wrap::before,.marcas-wrap::after{content:'';position:absolute;top:0;bottom:0;width:80px;z-index:2;pointer-events:none}
.marcas-wrap::before{left:0;background:linear-gradient(90deg,#F8FAFC,transparent)}
.marcas-wrap::after{right:0;background:linear-gradient(-90deg,#F8FAFC,transparent)}
.marcas-track{display:flex;gap:16px;width:max-content;animation:mcScroll 30s linear infinite}
@keyframes mcScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.marcas-track:hover{animation-play-state:paused}

.mc{background:#fff;border:2px solid var(--border);border-radius:var(--r);padding:24px 20px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;width:240px;flex-shrink:0}
.mc:hover{border-color:var(--g);transform:translateY(-4px);box-shadow:0 12px 36px rgba(0,0,0,0.1)}
.mc-logo{width:80px;height:80px;border-radius:16px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:36px;object-fit:contain}
.mc-name{font-family:'Sora',sans-serif;font-size:14px;font-weight:900;color:var(--bd);margin-bottom:4px;letter-spacing:-0.3px}
.mc-cat{font-size:11px;color:var(--muted);font-weight:600;margin-bottom:3px}
.mc-city{font-size:11px;color:var(--g);font-weight:700}
.mc-stars{font-size:11px;color:var(--gold);margin-top:8px}
.mc-verified{display:inline-flex;align-items:center;gap:4px;background:var(--gl);color:var(--gd);font-size:9px;font-weight:800;padding:3px 9px;border-radius:4px;margin-top:8px;letter-spacing:0.3px}

/* CIDADES */
.cid-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.cid{border-radius:var(--r);overflow:hidden;cursor:pointer;position:relative;height:130px;display:flex;align-items:flex-end;padding:16px;transition:all .2s}
.cid:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(0,0,0,0.18)}
.cid.big{grid-column:span 2;height:130px}
.cid-ov{position:absolute;inset:0;background:linear-gradient(180deg,transparent 15%,rgba(6,14,30,.82))}
.cid-inf{position:relative;z-index:1}
.cidb{display:inline-block;background:var(--g);color:#fff;font-size:9px;font-weight:800;padding:3px 9px;border-radius:4px;margin-bottom:6px;letter-spacing:0.4px}
.cidn{font-family:'Sora',sans-serif;font-size:17px;font-weight:900;color:#fff;line-height:1.1}
.cidc{font-size:11px;color:rgba(255,255,255,.65);margin-top:3px;font-weight:600}

/* BLOG */
.blog-grid{display:grid;grid-template-columns:1.8fr 1fr 1fr;gap:16px}
.bc{background:#fff;border:2px solid var(--border);border-radius:var(--r);overflow:hidden;cursor:pointer;transition:all .2s}
.bc:hover{box-shadow:0 10px 32px rgba(0,0,0,0.09);transform:translateY(-3px);border-color:var(--gm)}
.bc-img{display:flex;align-items:center;justify-content:center}
.bc-img.big{height:180px}
.bc-img.sm{height:120px}
.bctag{display:inline-block;font-size:9px;font-weight:800;padding:4px 10px;border-radius:5px;margin:14px 14px 0;letter-spacing:0.5px}
.bctit{font-size:13px;font-weight:800;color:var(--bd);padding:8px 14px;line-height:1.4}
.bcmeta{font-size:10px;color:var(--muted);padding:0 14px 14px;font-weight:600;display:flex;align-items:center;gap:5px}
.bcmeta svg{width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;flex-shrink:0}

/* LISTA EMPRESAS */
.list-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}

/* CTA */
.cta{background:linear-gradient(135deg,#061A0E 0%,#071535 100%);padding:64px 48px;text-align:center;position:relative;overflow:hidden}
.ctar1{position:absolute;width:400px;height:400px;border-radius:50%;border:1px solid rgba(26,155,106,0.1);top:-100px;left:-100px;pointer-events:none}
.ctar2{position:absolute;width:500px;height:500px;border-radius:50%;border:1px solid rgba(26,155,106,0.07);bottom:-140px;right:-120px;pointer-events:none}
.ctar3{position:absolute;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(26,155,106,0.08),transparent);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
.ctai{position:relative;z-index:1;max-width:580px;margin:0 auto}
.ctaey{font-size:11px;font-weight:800;color:var(--g);letter-spacing:2px;margin-bottom:16px}
.ctah{font-family:'Sora',sans-serif;font-size:36px;font-weight:900;color:#fff;letter-spacing:-1px;margin-bottom:12px;line-height:1.15}
.ctah span{color:var(--g)}
.ctas{font-size:15px;color:rgba(255,255,255,.4);margin-bottom:32px;line-height:1.6}
.ctabtns{display:flex;gap:12px;justify-content:center}
.ctabp{background:var(--g);color:#fff;font-size:14px;font-weight:800;padding:15px 30px;border-radius:var(--rs);border:none;cursor:pointer;font-family:inherit;transition:all .15s;box-shadow:0 6px 20px rgba(26,155,106,0.3)}
.ctabp:hover{background:var(--gd)}
.ctabs{background:transparent;color:rgba(255,255,255,.6);font-size:14px;font-weight:700;padding:15px 30px;border-radius:var(--rs);border:2px solid rgba(255,255,255,.12);cursor:pointer;font-family:inherit;transition:all .15s}
.ctabs:hover{border-color:rgba(255,255,255,.25);color:#fff}

/* PARCEIROS */
.par{background:linear-gradient(135deg,#E2F7EE 0%,#E2EEFF 100%);padding:44px 48px;display:flex;align-items:center;justify-content:space-between;gap:28px}
.parb{background:var(--g);color:#fff;font-size:10px;font-weight:800;padding:5px 13px;border-radius:5px;display:inline-block;margin-bottom:13px;letter-spacing:0.5px}
.parh{font-family:'Sora',sans-serif;font-size:24px;font-weight:900;color:var(--bd);margin-bottom:9px;letter-spacing:-0.4px}
.pars{font-size:13px;color:var(--tx);max-width:440px;line-height:1.55;font-weight:500}
.parbtn{background:var(--bd);color:#fff;font-size:14px;font-weight:800;padding:15px 28px;border-radius:var(--rs);border:none;cursor:pointer;font-family:inherit;flex-shrink:0;transition:all .15s}
.parbtn:hover{background:var(--bm)}

/* FOOTER */
.ft{background:var(--bd);padding:44px 48px 0}
.ftg{display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr;gap:36px;padding-bottom:36px}
.ftbrand{font-family:'Sora',sans-serif;font-size:17px;font-weight:900;color:#fff;margin-bottom:9px}
.ftbrand b{color:var(--g)}
.ftdesc{font-size:13px;color:#e2e8f0 !important;line-height:1.7;max-width:260px;font-weight:500}
.ftct{font-size:11px;font-weight:800;color:#ffffff !important;letter-spacing:1.2px;margin-bottom:14px}
.ftl{font-size:13px;color:#cbd5e1 !important;display:block;margin-bottom:10px;transition:color .15s;font-weight:600;cursor:pointer}
.ftl:hover{color:var(--g) !important}
.ftbot{border-top:1px solid rgba(255,255,255,.1);padding:24px 0;display:flex;justify-content:space-between;align-items:center;margin-top:20px}
.ftcopy{font-size:12px;color:rgba(255,255,255,.5);font-weight:500}
      ` }} />
      <div dangerouslySetInnerHTML={{ __html: `
<!-- NAVBAR -->
<nav class="nav">
  <div class="nlogo">
    <div class="nicon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    </div>
    <div class="nbrand">Guia Local <b>BR</b></div>
  </div>
  <div class="nmenu">
    <a class="nlink" href="/">Início</a>
    <a class="nlink" href="/busca">Buscar Empresas</a>
    <a class="nlink" href="/cadastro">Cadastrar Empresa</a>
    <a class="nlink" href="/admin">Dashboard Admin</a>
    <a class="nlink" href="/busca">Planos</a>
    <a class="nlink" href="/blog">Blog</a>
    <a class="nlink" href="/parceiros">Parceiros</a>
  </div>
  <div class="nacts">
    <a class="selink" href="/cadastro">Anunciar aqui <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-grid"></div>
  <div class="hero-glow"></div>
  <div class="hero-inner">
    <div class="hbadge"><div class="hdot"></div>O MAIOR GUIA COMERCIAL DO BRASIL</div>
    <h1>Encontre os Melhores<br>Negócios <span class="grad">Locais</span><br>da Sua Região</h1>
    <p class="hero-sub">Conecte-se com empresas verificadas e fale diretamente pelo WhatsApp — rápido, gratuito e seguro.</p>
    <div class="sbox">
      <div class="sico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
      <input id="sinp" type="text" placeholder="Pizzaria em Maringá...">
      <button class="sbtn">Buscar Agora</button>
    </div>
    <div class="stags">
      <span class="stag">Buscas comuns:</span>
      <span class="stag"><a>Estética</a></span>
      <span class="stag" style="color:#ddd">·</span>
      <span class="stag"><a>Pet Shop</a></span>
      <span class="stag" style="color:#ddd">·</span>
      <span class="stag"><a>Disk Gás</a></span>
      <span class="stag" style="color:#ddd">·</span>
      <span class="stag"><a>Advogado</a></span>
      <span class="stag" style="color:#ddd">·</span>
      <span class="stag"><a>Mecânica</a></span>
    </div>
  </div>
</section>

<!-- MARQUEE -->
<div class="mq-wrap"><div class="mq-inner" id="mq"></div></div>

<!-- STATS -->
<div class="stats">
  <div class="st"><div class="st-n"><em id="n1">0</em>+</div><div class="st-l">EMPRESAS CADASTRADAS</div></div>
  <div class="st"><div class="st-n"><em id="n2">0</em>+</div><div class="st-l">CIDADES ATENDIDAS</div></div>
  <div class="st"><div class="st-n"><em id="n3">0</em>+</div><div class="st-l">ESTADOS COBERTOS</div></div>
  <div class="st"><div class="st-n"><em id="n4">0</em>+</div><div class="st-l">MEMBROS PREMIUM</div></div>
</div>

<!-- CATEGORIAS -->
<section class="sec sec-alt">
  <div class="seh c">
    <div class="seeye">NAVEGUE POR NICHO</div>
    <div class="setit">Explore por <span>Categoria</span></div>
    <div class="sesub">Encontre exatamente o que você precisa em segundos</div>
  </div>
  <div class="cats" id="cats"></div>
</section>

<!-- BANNER GRANDE ROTATIVO -->
<section class="banner-sec">
  <div class="serow" style="padding:0 0 4px">
    <div>
      <div class="setit">Empresas em <span>Evidência</span></div>
    </div>
    <a class="selink" href="/cadastro">Anunciar aqui <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
  </div>
  <div id="banner-container"></div>
  <div class="banner-dots" id="bdots" style="position:relative;right:auto;bottom:auto;margin-top:16px;display:flex;justify-content:center;gap:6px"></div>
</section>

<!-- DESTAQUES FIXOS 3x4 -->
<section class="sec sec-bg2">
  <div class="dest-header">
    <div>
      <div class="setit">Empresas em <span>Destaque</span></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span class="dest-badge">⭐ DESTAQUE PREMIUM</span>
    </div>
  </div>
  <div class="dest-grid" id="dest-grid"></div>
</section>

<!-- GRANDES MARCAS -->
<section class="sec sec-alt">
  <div class="seh c">
    <div class="setit">Grandes <span>Marcas</span></div>
    <div class="sesub">As maiores empresas de cada cidade com presença verificada no Guia Local BR</div>
  </div>
  <div class="marcas-wrap">
    <div class="marcas-track" id="marcas"></div>
  </div>
</section>

<!-- CIDADES -->
<section class="sec sec-bg2">
  <div class="serow">
    <div>
      <div class="setit">Cidades em <span>Destaque</span></div>
    </div>
    <a class="selink" href="/busca">Ver todas as cidades <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
  </div>
  <div class="cid-grid" id="cids"></div>
</section>

<!-- BLOG -->
<section class="sec sec-alt">
  <div class="serow">
    <div>
      <div class="seeye">CONTEÚDO LOCAL</div>
      <div class="setit">Blog & <span>Dicas</span></div>
    </div>
    <a class="selink" href="/blog">Ver tudo <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
  </div>
  <div class="blog-grid">
    <div class="bc">
      <div class="bc-img big" style="background:linear-gradient(135deg,#E2F7EE,#C8EAD8)"><span style="font-size:56px">🏆</span></div>
      <span class="bctag" style="background:#E2F7EE;color:#0F6B4A">DICAS DE NEGÓCIO</span>
      <div class="bctit">Como colocar sua empresa no topo das buscas locais do Google em 2026</div>
      <div class="bcmeta"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>02 Jun 2026 · 5 min de leitura</div>
    </div>
    <div class="bc">
      <div class="bc-img sm" style="background:linear-gradient(135deg,#EDF6FF,#C8DCFF)"><span style="font-size:40px">⭐</span></div>
      <span class="bctag" style="background:#EDF6FF;color:#1A3A8A">PREMIUM</span>
      <div class="bctit">Por que empresas premium recebem 10x mais cliques no WhatsApp</div>
      <div class="bcmeta"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>01 Jun 2026 · 3 min</div>
    </div>
    <div class="bc">
      <div class="bc-img sm" style="background:linear-gradient(135deg,#FFF3E0,#FFE0B2)"><span style="font-size:40px">📍</span></div>
      <span class="bctag" style="background:#FFF3E0;color:#7D4000">PARCEIROS</span>
      <div class="bctit">Seja o consultor exclusivo do Guia Local BR na sua cidade</div>
      <div class="bcmeta"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>30 Mai 2026 · 4 min</div>
    </div>
  </div>
</section>

<!-- TODAS EMPRESAS -->
<section class="sec" style="background:var(--bg)">
  <div class="serow">
    <div>
      <div class="setit">Empresas <span>Recentes</span></div>
    </div>
    <a class="selink" href="/busca">Ver todas <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
  </div>
  <div class="list-grid" id="lista"></div>
</section>

<!-- CTA -->
<section class="cta">
  <div class="ctar1"></div><div class="ctar2"></div><div class="ctar3"></div>
  <div class="ctai">
    <div class="ctaey">ANUNCIE AGORA</div>
    <h2 class="ctah">Sua empresa ainda não está<br>listada no <span>Guia Local BR</span>?</h2>
    <p class="ctas">Coloque seu negócio na frente de clientes locais que já estão buscando o que você oferece.</p>
    <div class="ctabtns">
      <button class="ctabp">Cadastrar Empresa Grátis →</button>
      <button class="ctabs">Conhecer o Plano Premium</button>
    </div>
  </div>
</section>

<!-- PARCEIROS -->
<div class="par">
  <div>
    <span class="parb">SEJA UM LICENCIADO</span>
    <h2 class="parh">Quer ser o Consultor Exclusivo na sua cidade?</h2>
    <p class="pars">Exclusividade territorial, renda recorrente e suporte completo de uma plataforma de alta tecnologia. Gerencie empresas ilimitadas e venda premium localmente.</p>
  </div>
  <button class="parbtn">Falar com o Time →</button>
</div>

<!-- FOOTER -->
<footer class="ft">
  <div class="ftg">
    <div>
      <div class="ftbrand">Guia Local <b>BR</b></div>
      <p class="ftdesc">O maior buscador de negócios locais do Brasil. Conectando pessoas e oportunidades em todo território nacional.</p>
    </div>
    <div>
      <div class="ftct">ATALHOS</div>
      <a class="ftl" href="/sobre">Sobre Nós</a><a class="ftl" href="/blog">Nosso Blog</a><a class="ftl" href="/busca">Categorias</a><a class="ftl" href="/busca">Cidades</a><a class="ftl" href="/admin">Baixar Planilha (.xlsx)</a>
    </div>
    <div>
      <div class="ftct">PARCERIAS</div>
      <a class="ftl" href="/cadastro">Anunciar Negócio</a><a class="ftl" href="/parceiro">Seja um Parceiro</a><a class="ftl" href="/cadastro">Planos e Preços</a><a class="ftl" href="/parceiros">Programa de Parceiros</a>
    </div>
    <div>
      <div class="ftct">INSTITUCIONAL</div>
      <a class="ftl" href="/privacidade">Política de Privacidade</a><a class="ftl" href="/termos">Termos de Uso</a><a class="ftl" href="/contato">Contato</a>
    </div>
  </div>
  <div class="ftbot">
    <span class="ftcopy">© 2026 Guia Local BR · Todos os direitos reservados</span>
    <span class="ftcopy">Desenvolvido com tecnologia de ponta</span>
  </div>
</footer>
      `}} />
    </div>
  );
}
