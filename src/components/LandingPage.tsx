import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Smartphone, 
  UtensilsCrossed, 
  ChefHat, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  Users, 
  Layers, 
  Store, 
  Menu, 
  X, 
  ChevronDown, 
  Zap, 
  BadgeCheck, 
  Headphones, 
  Gift, 
  HelpCircle, 
  Send, 
  Coffee, 
  Pizza, 
  Fish, 
  Percent, 
  Truck, 
  Monitor,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Star,
  Activity,
  Check
} from 'lucide-react';
import { User, Restaurant } from '../types';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToLiveDemo: (role?: 'ADMIN' | 'OWNER' | 'KITCHEN' | 'WAITER' | 'DELIVERY' | 'CUSTOMER') => void;
  restaurants?: Restaurant[];
  users?: User[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToLogin,
  onGoToLiveDemo,
  restaurants = [],
  users = []
}) => {
  // Navigation & Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeTabWorkflow, setActiveTabWorkflow] = useState<number>(0);

  // Conversion / Lead Form Modal State
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadType, setLeadType] = useState<'FOUNDER' | 'UPLOAD_MENU' | 'FREE_TRIAL'>('FREE_TRIAL');
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadRestaurantName, setLeadRestaurantName] = useState('');
  const [leadCity, setLeadCity] = useState('');
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Dynamic SEO title & description update
  useEffect(() => {
    document.title = "Mi Carta | Sistema de pedidos para restaurantes";
    
    // Update or insert meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Recibe pedidos desde el celular de tus clientes, gestiona mesas, cocina, delivery y controla tu restaurante desde un solo lugar.');

    // Update OpenGraph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Mi Carta | Sistema de pedidos para restaurantes');
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Tu carta. Tus pedidos. Tu restaurante. Convierte tu carta en un sistema completo de pedidos.');
  }, []);

  const openLeadModal = (type: 'FOUNDER' | 'UPLOAD_MENU' | 'FREE_TRIAL') => {
    setLeadType(type);
    setLeadSuccess(false);
    setIsLeadModalOpen(true);
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadRestaurantName.trim() || !leadPhone.trim()) return;

    // Send direct WhatsApp message for instant founder / menu assistance
    const targetTypeTitle = leadType === 'FOUNDER' 
      ? 'Programa 100 Restaurantes Fundadores' 
      : leadType === 'UPLOAD_MENU' 
      ? 'Cargar mi Carta Digital' 
      : 'Prueba Gratis de Mi Carta';

    const message = `Hola equipo de Mi Carta! 👋 Deseo postular a *${targetTypeTitle}*:%0A%0A` +
      `🍽️ *Restaurante:* ${encodeURIComponent(leadRestaurantName)}%0A` +
      `👤 *Contacto:* ${encodeURIComponent(leadName || 'Propietario')}%0A` +
      `📱 *Teléfono:* ${encodeURIComponent(leadPhone)}%0A` +
      `📍 *Ciudad:* ${encodeURIComponent(leadCity || 'Perú')}%0A%0A` +
      `Por favor contáctenme para activar mi sistema sin comisiones.`;

    const whatsappUrl = `https://wa.me/51952341165?text=${message}`;
    
    setLeadSuccess(true);
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setIsLeadModalOpen(false);
      setLeadSuccess(false);
    }, 1200);
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // FAQ list data
  const faqs = [
    {
      q: '¿Mi cliente necesita instalar una aplicación?',
      a: 'No, en absoluto. Tus clientes solo tienen que escanear el código QR con la cámara de su celular y tu carta digital se abrirá al instante en su navegador sin descargas pesadas ni registros obligatorios.'
    },
    {
      q: '¿Puedo utilizar Mi Carta para atención en mesa?',
      a: 'Sí. Cada mesa tiene un código QR exclusivo vinculado a su número y zona (Salón, Terraza, VIP, Barra). Cuando el cliente pide, la comanda llega automáticamente a la pantalla de cocina y al panel de meseros con la mesa identificada.'
    },
    {
      q: '¿Puedo recibir pedidos por delivery?',
      a: 'Sí. Mi Carta incluye un módulo integrado de pedidos a domicilio con cálculo de pedido mínimo, tiempo estimado de entrega, datos de dirección y panel especializado para repartidores motorizados.'
    },
    {
      q: '¿El QR puede identificar la mesa?',
      a: 'Sí. Al generar los códigos QR desde tu panel, cada uno queda configurado con el número y zona de la mesa. El cliente no necesita escribir su mesa manualmente.'
    },
    {
      q: '¿Puedo modificar precios y platos en cualquier momento?',
      a: 'Sí, desde tu celular, tablet o computadora. Los cambios de precios, platos nuevos, fotos o platos temporalmente agotados se sincronizan en vivo en segundos sin necesidad de reimprimir cartas.'
    },
    {
      q: '¿Puedo gestionar adicionales y opciones de personalización?',
      a: 'Totalmente. Puedes configurar términos de carne, salsas extras, acompañamientos, tamaños y notas de preparación especiales ("sin cebolla", "bien cocido"), tanto obligatorias como opcionales.'
    },
    {
      q: '¿Puedo saber el estado de cada pedido en tiempo real?',
      a: 'Sí. Todo el equipo y el cliente están conectados en vivo. El cliente ve el progreso de su pedido (Recibido → En Cocina → Listo → En Mesa) y cocina organiza sus comandas según tiempos de preparación.'
    },
    {
      q: '¿Mi Carta cobra comisión por cada pedido?',
      a: '0% de comisión. Cobramos una tarifa fija mensual por el uso del sistema. El 100% del dinero de tus ventas es tuyo.'
    },
    {
      q: '¿Puedo utilizarlo en mi celular?',
      a: 'Sí. Todo el sistema está construido con arquitectura web moderna y responsive. Funciona de manera fluida en cualquier smartphone, tablet o computadora sin requerir equipos POS costosos.'
    },
    {
      q: '¿Qué necesito para empezar?',
      a: 'Solo necesitas registrarte, ingresar o enviarnos tu lista de platos y precios, e imprimir tus códigos QR para colocarlos en tus mesas o compartirlos por redes sociales.'
    }
  ];

  // Business types list
  const businessTypes = [
    { name: 'Hamburgueserías', icon: '🍔', tag: 'Combos, salsas y extras' },
    { name: 'Fast Food', icon: '⚡', tag: 'Comandas ultra rápidas a cocina' },
    { name: 'Cevicherías', icon: '🐟', tag: 'Nivel de picante y guarniciones' },
    { name: 'Pollerías', icon: '🍗', tag: 'Porciones, ensaladas y delivery' },
    { name: 'Pizzerías', icon: '🍕', tag: 'Mitad y mitad e ingredientes' },
    { name: 'Dark Kitchens', icon: '🍳', tag: 'Múltiples marcas en una sola cocina' },
    { name: 'Cafeterías', icon: '☕', tag: 'Bebidas, leches y pastelería' },
    { name: 'Restaurantes', icon: '🍷', tag: 'Atención en salón y autor' },
    { name: 'Emprendimientos', icon: '🚀', tag: 'Ventas digitales sin comisiones' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 w-full bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <a href="/carta" className="flex items-center gap-2.5 group">
              <img 
                src="/huevofrito.svg" 
                alt="Mi Carta Logo" 
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" 
              />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                  Mi Carta
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold tracking-normal uppercase">
                    SaaS
                  </span>
                </span>
                <span className="text-[10px] text-neutral-400 -mt-0.5 tracking-tight">
                  Sistema de Pedidos para Restaurantes
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
            <button 
              onClick={() => scrollToSection('caracteristicas')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Características
            </button>
            <button 
              onClick={() => scrollToSection('como-funciona')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Cómo funciona
            </button>
            <button 
              onClick={() => scrollToSection('planes')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Planes
            </button>
            <button 
              onClick={() => scrollToSection('fundadores')} 
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 text-amber-300 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              100 Fundadores
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Preguntas frecuentes
            </button>
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 text-xs font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-800 rounded-lg hover:border-neutral-700 bg-neutral-900/50"
            >
              Ingresar al Sistema
            </button>
            <button
              onClick={() => openLeadModal('FREE_TRIAL')}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-neutral-950" />
              Probar Gratis
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => openLeadModal('FREE_TRIAL')}
              className="px-3 py-1.5 text-xs font-black uppercase tracking-wider text-neutral-950 bg-amber-400 rounded-lg shadow-md"
            >
              Probar Gratis
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900 border border-neutral-800"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Nav Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-neutral-900 border-b border-neutral-800 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4">
            <button 
              onClick={() => scrollToSection('caracteristicas')} 
              className="block w-full text-left py-2 text-sm font-medium text-neutral-300 hover:text-amber-400"
            >
              Características
            </button>
            <button 
              onClick={() => scrollToSection('como-funciona')} 
              className="block w-full text-left py-2 text-sm font-medium text-neutral-300 hover:text-amber-400"
            >
              Cómo funciona
            </button>
            <button 
              onClick={() => scrollToSection('planes')} 
              className="block w-full text-left py-2 text-sm font-medium text-neutral-300 hover:text-amber-400"
            >
              Planes y Precios
            </button>
            <button 
              onClick={() => scrollToSection('fundadores')} 
              className="block w-full text-left py-2 text-sm font-semibold text-amber-300"
            >
              ✨ Programa 100 Fundadores
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="block w-full text-left py-2 text-sm font-medium text-neutral-300 hover:text-amber-400"
            >
              Preguntas Frecuentes
            </button>
            <div className="pt-3 border-t border-neutral-800 flex flex-col gap-2">
              <button
                onClick={onGoToLogin}
                className="w-full py-2.5 text-center text-xs font-bold text-neutral-200 bg-neutral-800 rounded-lg"
              >
                Ingresar al Sistema
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openLeadModal('FREE_TRIAL');
                }}
                className="w-full py-2.5 text-center text-xs font-black uppercase tracking-wider text-neutral-950 bg-amber-400 rounded-lg shadow-md"
              >
                Probar Gratis
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Subtle glowing ambient lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-emerald-500/10 to-transparent blur-[120px] pointer-events-none -z-10 rounded-full" />
        <div className="absolute top-12 right-10 w-96 h-96 bg-amber-500/5 blur-[100px] pointer-events-none -z-10 rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Hero Copy & Badges */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* 0% Commission & Launch Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold shadow-sm animate-pulse">
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              <span>0% de comisión por pedido · Todo lo que vendes es 100% tuyo</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
              Tu carta. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                Tus pedidos.
              </span> <br className="hidden sm:inline" />
              Tu restaurante.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-neutral-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Convierte tu carta en un sistema completo de pedidos. Tu cliente escanea, elige y pide desde su celular. Tu equipo recibe, prepara y entrega. Tú controlas todo.
            </p>

            {/* Hero CTA Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => openLeadModal('FREE_TRIAL')}
                className="w-full sm:w-auto px-8 py-4 text-sm font-black uppercase tracking-wider text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-xl shadow-amber-500/25 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-neutral-950" />
                Probar Gratis
              </button>

              <button
                onClick={() => scrollToSection('como-funciona')}
                className="w-full sm:w-auto px-7 py-4 text-sm font-bold text-neutral-200 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-600 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Ver Cómo Funciona
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            {/* Micro proof bullets */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Sin equipos POS costosos
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No requiere descargar apps
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Activación en menos de 24 horas
              </span>
            </div>

          </div>

          {/* SYSTEM VISUAL REPRESENTATION (Interactive Native UI Mockup) */}
          <div className="mt-14 lg:mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-2xl bg-gradient-to-b from-neutral-800/60 to-neutral-900/90 p-3 sm:p-6 border border-neutral-800 shadow-2xl shadow-black/80 backdrop-blur-sm">
              
              {/* Top window bar */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-neutral-400 hidden sm:inline">
                    micarta.pe · Sistema en Vivo
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-400 font-medium">Sincronización en Tiempo Real</span>
                </div>
              </div>

              {/* Multi-Device Grid Representation */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* 1. Mobile Phone Mockup (Client Ordering) */}
                <div className="md:col-span-5 bg-neutral-950 rounded-2xl border-2 border-neutral-800 p-3 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-900 text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      Vista del Cliente
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                      Mesa 04 · Salón
                    </span>
                  </div>

                  {/* Sample Dish Card */}
                  <div className="mt-3 space-y-2.5">
                    <div className="bg-neutral-900 rounded-xl p-2.5 border border-neutral-800 flex gap-3 items-center">
                      <img 
                        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80" 
                        alt="Hamburguesa Doble" 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white truncate">Burger Monster Doble</h4>
                          <span className="text-xs font-black text-amber-400">S/ 32.00</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 line-clamp-1">Doble carne Angus, queso cheddar, tocino ahumado</p>
                        <div className="mt-1 flex gap-1">
                          <span className="text-[9px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">Término 3/4</span>
                          <span className="text-[9px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">+Papas</span>
                        </div>
                      </div>
                    </div>

                    {/* Active Order Button */}
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <div>
                          <p className="text-[11px] font-bold text-emerald-400">Comanda #104 Confirmada</p>
                          <p className="text-[10px] text-neutral-400">En preparación en cocina · 03:45 min</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">S/ 64.00</span>
                    </div>
                  </div>
                </div>

                {/* 2. Kitchen KDS & Real-time Flow */}
                <div className="md:col-span-7 space-y-3">
                  
                  {/* Kitchen Live Ticket */}
                  <div className="bg-neutral-900/90 rounded-xl p-3 border border-neutral-800">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-white">Pantalla de Cocina (KDS)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold rounded">
                        Comanda Nueva · Mesa 04
                      </span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 text-neutral-300">
                      <div className="flex justify-between">
                        <span>2x Burger Monster Doble (Término 3/4)</span>
                        <span className="text-neutral-400 font-mono">03:45</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Limonada Frozen 1L</span>
                        <span className="text-emerald-400 font-bold text-[10px]">LISTO</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Dashboard Metrics preview */}
                  <div className="bg-neutral-900/90 rounded-xl p-3 border border-neutral-800 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                      <p className="text-[10px] text-neutral-400">Ventas Hoy</p>
                      <p className="text-sm font-black text-amber-400">S/ 2,480.00</p>
                    </div>
                    <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                      <p className="text-[10px] text-neutral-400">Comisión</p>
                      <p className="text-sm font-black text-emerald-400">0.00%</p>
                    </div>
                    <div className="bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                      <p className="text-[10px] text-neutral-400">Mesas Activas</p>
                      <p className="text-sm font-black text-white">12 / 14</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. SECCIÓN: NO ES SOLO UNA CARTA QR */}
      <section id="caracteristicas" className="py-20 bg-neutral-900/60 border-y border-neutral-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Ecosistema Integral
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              No es solo una carta QR.
            </h2>
            <p className="text-lg text-neutral-400">
              Es el sistema que conecta a tu cliente con tu restaurante.
            </p>
          </div>

          {/* Visual connected pipeline */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* 1. Cliente */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">1. Cliente</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Escanea, personaliza platos, pide desde su celular y sigue el estado en vivo.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                0 Descargas
              </span>
            </div>

            {/* 2. Mi Carta (El Motor) */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-neutral-950" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">2. Mi Carta</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Procesa la orden al instante, calcula totales y enruta la comanda sin errores.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Enrutador en Vivo
              </span>
            </div>

            {/* 3. Cocina */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 hover:border-orange-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ChefHat className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">3. Cocina</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Pantalla KDS interactiva. Tiempos de preparación, mesa identificada y alerta de plato listo.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                KDS Digital
              </span>
            </div>

            {/* 4. Mesero */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 hover:border-sky-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">4. Mesero</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Control de mesas asignadas, toma de pedidos manual o digital y llamadas de atención.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                Gestión de Salón
              </span>
            </div>

            {/* 5. Repartidor */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Truck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">5. Repartidor</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Panel móvil de despacho, direcciones de entrega, tiempo estimado y botón de WhatsApp.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Delivery Propio
              </span>
            </div>

            {/* 6. Dueño */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 hover:border-purple-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">6. Dueño</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Métricas de ventas, ticket promedio, control de precios, platos agotados y personal.
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                Control Total
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SECCIÓN: CÓMO FUNCIONA (5 Pasos) */}
      <section id="como-funciona" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Flujo Simple & Rápido
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Cómo funciona
          </h2>
          <p className="text-lg text-neutral-400">
            Diseñado para agilizar la atención y maximizar la satisfacción de tus comensales.
          </p>
        </div>

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Step 1 */}
          <div className="bg-neutral-900/80 rounded-2xl p-5 border border-neutral-800 relative flex flex-col justify-between">
            <div>
              <span className="text-3xl font-black text-amber-500/30 font-mono">01</span>
              <h3 className="text-base font-bold text-white mt-2 mb-1.5">El cliente escanea el QR</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Directo en la mesa o desde casa. Sin descargar aplicaciones ni registros molestos.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-amber-400 font-semibold">
              <QrCode className="w-4 h-4" />
              <span>Abre al instante</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-neutral-900/80 rounded-2xl p-5 border border-neutral-800 relative flex flex-col justify-between">
            <div>
              <span className="text-3xl font-black text-amber-500/30 font-mono">02</span>
              <h3 className="text-base font-bold text-white mt-2 mb-1.5">Explora la carta</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Categorías intuitivas, fotos de alta calidad, descripciones apetitosas y precios claros.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-amber-400 font-semibold">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Diseño atractivo</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-neutral-900/80 rounded-2xl p-5 border border-neutral-800 relative flex flex-col justify-between">
            <div>
              <span className="text-3xl font-black text-amber-500/30 font-mono">03</span>
              <h3 className="text-base font-bold text-white mt-2 mb-1.5">Personaliza y pide</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Elige términos de carne, salsas, adicionales y notas especiales antes de enviar la comanda.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-amber-400 font-semibold">
              <ShoppingBag className="w-4 h-4" />
              <span>Carrito inteligente</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-neutral-900/80 rounded-2xl p-5 border border-neutral-800 relative flex flex-col justify-between">
            <div>
              <span className="text-3xl font-black text-amber-500/30 font-mono">04</span>
              <h3 className="text-base font-bold text-white mt-2 mb-1.5">Cocina recibe el pedido</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                La orden aparece automáticamente en la pantalla KDS y en el panel de mozos con mesa exacta.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-amber-400 font-semibold">
              <ChefHat className="w-4 h-4" />
              <span>Cero papelitos</span>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-neutral-900/80 rounded-2xl p-5 border border-neutral-800 relative flex flex-col justify-between">
            <div>
              <span className="text-3xl font-black text-amber-500/30 font-mono">05</span>
              <h3 className="text-base font-bold text-white mt-2 mb-1.5">Sigue su pedido</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                El cliente puede consultar en tiempo real si su comida está en preparación o servida.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Seguimiento en vivo</span>
            </div>
          </div>

        </div>

      </section>

      {/* 5. SECCIÓN: TODO TU RESTAURANTE CONECTADO */}
      <section className="py-20 bg-neutral-900/40 border-t border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Módulos Especializados
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Todo tu restaurante conectado
            </h2>
            <p className="text-lg text-neutral-400">
              Cada área de tu negocio cuenta con una interfaz adaptada a su rol y necesidad.
            </p>
          </div>

          {/* 6 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Cliente */}
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-2xl">
                  📱
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cliente</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Carta digital interactiva ultrarrápida, carrito de compras, selección de guarniciones y seguimiento de pedido en vivo desde cualquier smartphone.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Experiencia Móvil</span>
                <span className="text-amber-400 font-bold">100% Nativo Web</span>
              </div>
            </div>

            {/* Card 2: Mesas */}
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 text-2xl">
                  🍽️
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Mesas</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Códigos QR inteligentes organizados por zonas (Salón, Terraza, VIP, Barra), asignación de mozos por turno y control de mesas disponibles u ocupadas.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Control de Salón</span>
                <span className="text-sky-400 font-bold">QR Inteligente</span>
              </div>
            </div>

            {/* Card 3: Cocina */}
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 text-2xl">
                  👨‍🍳
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Cocina</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Kitchen Display System (KDS) digital en tiempo real que organiza comandas por antigüedad, muestra notas del comensal y permite apagar platos agotados (86).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Despacho y Tiempos</span>
                <span className="text-orange-400 font-bold">KDS Digital</span>
              </div>
            </div>

            {/* Card 4: Dueño */}
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-2xl">
                  👨‍💼
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Dueño</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Panel gerencial con métricas de facturación del día, ticket promedio, platos más vendidos, control de cartas, personal y auditoría de pedidos.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Gestión Estratégica</span>
                <span className="text-purple-400 font-bold">Panel 360°</span>
              </div>
            </div>

            {/* Card 5: Delivery */}
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-2xl">
                  🛵
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Delivery</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Recepción de pedidos para delivery sin pagar comisiones a terceros, cálculo de pedido mínimo, tiempo estimado y asignación directa a motorizados.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Canal a Domicilio</span>
                <span className="text-emerald-400 font-bold">0% Comisión</span>
              </div>
            </div>

            {/* Card 6: Control */}
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-2xl">
                  📊
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Control</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Configuración de horarios semanales por sede, turnos de trabajo, permisos para meseros y respaldo de información seguro en la nube.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Seguridad & Turnos</span>
                <span className="text-rose-400 font-bold">Nube Segura</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. SECCIÓN: HECHO PARA NEGOCIOS COMO EL TUYO */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Adaptabilidad Total
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Hecho para negocios como el tuyo
          </h2>
          <p className="text-sm sm:text-base text-neutral-400">
            Desde cevicherías tradicionales hasta dark kitchens de alto volumen.
          </p>
        </div>

        {/* Compact Grid of Business Types */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {businessTypes.map((biz, idx) => (
            <div 
              key={idx}
              className="bg-neutral-900/60 p-3.5 sm:p-4 rounded-xl border border-neutral-800 flex items-center gap-3 hover:border-amber-500/30 transition-all"
            >
              <span className="text-2xl sm:text-3xl shrink-0">{biz.icon}</span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">{biz.name}</h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 truncate">{biz.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. SECCIÓN DE PLANES & PRECIOS */}
      <section id="planes" className="py-20 bg-neutral-900/40 border-t border-neutral-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Precios Transparentes
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Empieza a vender digitalmente
            </h2>
            <p className="text-lg text-neutral-400">
              Elige el plan que mejor se adapte al tamaño de tu operación gastronómica.
            </p>

            {/* Billing Cycle Selector Toggle */}
            <div className="pt-4 flex items-center justify-center">
              <div className="bg-neutral-900 p-1 rounded-xl border border-neutral-800 inline-flex items-center gap-1">
                <button
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    billingCycle === 'MONTHLY'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Pago mensual
                </button>
                <button
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === 'ANNUAL'
                      ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Pago anual</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">
                    2 meses gratis
                  </span>
                </button>
              </div>
            </div>

            {/* Highlighted 0% Commission Guarantee */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mt-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantía: 0% de comisión por pedido en todos los planes</span>
            </div>
          </div>

          {/* Exactly 3 Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* PLAN 1: EMPRENDE */}
            <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-800 flex flex-col justify-between hover:border-neutral-700 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  Plan Inicial
                </span>
                <h3 className="text-2xl font-black text-white mt-1">EMPRENDE</h3>
                <p className="text-xs text-neutral-400 mt-1 mb-6">
                  Para empezar a recibir pedidos.
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-white">
                    {billingCycle === 'MONTHLY' ? 'S/ 49' : 'S/ 490'}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {billingCycle === 'MONTHLY' ? '/ mes' : '/ año'}
                  </span>
                </div>

                {/* Features list */}
                <div className="space-y-3 text-xs text-neutral-300">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>1 Restaurante o Sede activa</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Carta digital con QR ilimitado</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Pedidos directos desde el celular del cliente</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Hasta 10 mesas con QR por mesa</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Panel básico para el dueño</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>0% de comisión por pedido</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800">
                <button
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="w-full py-3 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl transition-all cursor-pointer text-center"
                >
                  Comenzar con Emprende
                </button>
              </div>
            </div>

            {/* PLAN 2: NEGOCIO (MÁS ELEGIDO) */}
            <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl border-2 border-amber-500 shadow-2xl shadow-amber-500/10 flex flex-col justify-between relative bg-gradient-to-b from-amber-500/5 to-neutral-950">
              
              {/* Badge: MÁS ELEGIDO */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 text-[11px] font-black uppercase tracking-wider shadow-md">
                ⭐ MÁS ELEGIDO
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Recomendado para Salón
                </span>
                <h3 className="text-2xl font-black text-white mt-1">NEGOCIO</h3>
                <p className="text-xs text-neutral-300 mt-1 mb-6">
                  Para controlar tu restaurante.
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-amber-400">
                    {billingCycle === 'MONTHLY' ? 'S/ 89' : 'S/ 890'}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {billingCycle === 'MONTHLY' ? '/ mes' : '/ año'}
                  </span>
                </div>

                {/* Features list */}
                <div className="space-y-3 text-xs text-neutral-200">
                  <div className="flex items-start gap-2.5 font-semibold text-white">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Todo lo incluido en Emprende, más:</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Mesas ilimitadas organizadas por zonas</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Pantalla de Cocina (KDS) en tiempo real</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Panel móvil para Meseros y Mozos</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Módulo de Delivery propio sin intermediarios</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Seguimiento de pedidos en vivo para el cliente</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Soporte prioritario por WhatsApp</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800">
                <button
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="w-full py-3 text-xs font-black uppercase tracking-wider text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer text-center"
                >
                  Probar Plan Negocio Gratis
                </button>
              </div>
            </div>

            {/* PLAN 3: PROFESIONAL */}
            <div className="bg-neutral-950 p-6 sm:p-8 rounded-2xl border border-neutral-800 flex flex-col justify-between hover:border-neutral-700 transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                  Alto Volumen & Cadenas
                </span>
                <h3 className="text-2xl font-black text-white mt-1">PROFESIONAL</h3>
                <p className="text-xs text-neutral-400 mt-1 mb-6">
                  Para operaciones más completas.
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-white">
                    {billingCycle === 'MONTHLY' ? 'S/ 149' : 'S/ 1,490'}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {billingCycle === 'MONTHLY' ? '/ mes' : '/ año'}
                  </span>
                </div>

                {/* Features list */}
                <div className="space-y-3 text-xs text-neutral-300">
                  <div className="flex items-start gap-2.5 font-semibold text-white">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Todo lo incluido en Negocio, más:</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Múltiples sedes o locales gestionados</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Panel para Repartidores y Despacho</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Gestión de turnos y horarios de personal</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Estadísticas avanzadas y reportes de ventas</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Personalización total de branding y colores</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Acompañamiento e implementación VIP 24/7</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800">
                <button
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="w-full py-3 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl transition-all cursor-pointer text-center"
                >
                  Comenzar con Profesional
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 8. OFERTA DE LANZAMIENTO: PROGRAMA 100 RESTAURANTES FUNDADORES */}
      <section id="fundadores" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-amber-500/10 via-neutral-900 to-neutral-950 p-6 sm:p-12 border-2 border-amber-500/40 shadow-2xl overflow-hidden">
          
          {/* Background decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[90px] pointer-events-none rounded-full" />

          <div className="relative z-10 max-w-3xl space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>OFERTA DE LANZAMIENTO LIMITADA</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              PROGRAMA 100 RESTAURANTES FUNDADORES
            </h2>

            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
              Sé uno de los primeros restaurantes en utilizar Mi Carta y obtén beneficios exclusivos de por vida para impulsar la digitalización de tu negocio.
            </p>

            {/* 6 Founder Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="flex items-center gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-neutral-200">Primer mes 100% gratis sin compromiso</span>
              </div>
              <div className="flex items-center gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-neutral-200">Configuración inicial completa de tu carta</span>
              </div>
              <div className="flex items-center gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-neutral-200">Códigos QR personalizados con tu logo</span>
              </div>
              <div className="flex items-center gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-neutral-200">Capacitación virtual a tu equipo de trabajo</span>
              </div>
              <div className="flex items-center gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-neutral-200">Soporte y acompañamiento en implementación</span>
              </div>
              <div className="flex items-center gap-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
                <BadgeCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-neutral-200">Precio fundador congelado durante 12 meses</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => openLeadModal('FOUNDER')}
                className="w-full sm:w-auto px-8 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-xl shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 fill-neutral-950" />
                Quiero Ser Restaurante Fundador
              </button>
              <span className="text-xs text-neutral-400">
                ⚡ Solo 100 cupos disponibles para lanzamiento oficial
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 9. SECCIÓN: NOSOTROS CARGAMOS TU CARTA */}
      <section className="py-16 bg-neutral-900/60 border-y border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-4xl mx-auto bg-neutral-950 p-6 sm:p-10 rounded-2xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-8">
            
            <div className="space-y-3 flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Headphones className="w-3.5 h-3.5" />
                Servicio Asistido
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ¿No tienes tiempo para configurar tu carta?
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Envíanos tus platos, fotos, precios y adicionales. Nuestro equipo especializado se encarga de digitalizarlos y dejar tu sistema 100% listo para recibir pedidos.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto text-center">
              <button
                onClick={() => openLeadModal('UPLOAD_MENU')}
                className="w-full md:w-auto px-8 py-4 text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Quiero Mi Carta
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 10. PREGUNTAS FRECUENTES (FAQ) */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Resolvemos tus Dudas
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="text-sm sm:text-base text-neutral-400">
            Todo lo que necesitas saber antes de empezar a utilizar Mi Carta.
          </p>
        </div>

        {/* Accordion list */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-neutral-900/70 border border-neutral-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-800/40 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-white">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-300 leading-relaxed border-t border-neutral-800/40 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

      {/* 11. CTA FINAL */}
      <section className="py-20 bg-gradient-to-b from-neutral-900/60 to-neutral-950 border-t border-neutral-800 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Haz que tu carta empiece a recibir pedidos.
          </h2>

          <p className="text-base sm:text-xl text-neutral-300 max-w-2xl mx-auto">
            Menos pedidos manuales. Menos errores. Más control.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openLeadModal('FREE_TRIAL')}
              className="w-full sm:w-auto px-9 py-4 text-sm font-black uppercase tracking-wider text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-xl shadow-amber-500/25 transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              Probar Mi Carta Gratis
            </button>

            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-8 py-4 text-sm font-bold text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl transition-all cursor-pointer"
            >
              Acceso a Mi Panel
            </button>
          </div>

          <p className="text-xs text-neutral-400 pt-2">
            Sin tarjeta de crédito requerida · Activación inmediata
          </p>

        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-12 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-neutral-900">
            
            {/* Brand column */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <img src="/huevofrito.svg" alt="Mi Carta" className="w-7 h-7 object-contain" />
                <span className="text-base font-black tracking-wider text-white uppercase">
                  Mi Carta
                </span>
              </div>
              <p className="text-neutral-400 max-w-sm leading-relaxed">
                Sistema integral de pedidos y gestión para restaurantes, bares, dark kitchens y franquicias. Transforma tu carta en un motor de ventas sin comisiones.
              </p>
              <div className="flex items-center gap-2 pt-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Plataforma SaaS Cloud Operativa 99.9%</span>
              </div>
            </div>

            {/* Navigation links */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegación</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('caracteristicas')} className="hover:text-amber-400 transition-colors">Características</button></li>
                <li><button onClick={() => scrollToSection('como-funciona')} className="hover:text-amber-400 transition-colors">Cómo funciona</button></li>
                <li><button onClick={() => scrollToSection('planes')} className="hover:text-amber-400 transition-colors">Planes y Precios</button></li>
                <li><button onClick={() => scrollToSection('fundadores')} className="hover:text-amber-400 transition-colors">100 Fundadores</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-amber-400 transition-colors">Preguntas frecuentes</button></li>
              </ul>
            </div>

            {/* Direct access */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Accesos Rápidos</h4>
              <ul className="space-y-2">
                <li><button onClick={onGoToLogin} className="hover:text-amber-400 transition-colors">Iniciar Sesión</button></li>
                <li><button onClick={() => onGoToLiveDemo('ADMIN')} className="hover:text-amber-400 transition-colors">Demo Administrador</button></li>
                <li><button onClick={() => onGoToLiveDemo('OWNER')} className="hover:text-amber-400 transition-colors">Demo Dueño de Restaurante</button></li>
                <li><button onClick={() => onGoToLiveDemo('KITCHEN')} className="hover:text-amber-400 transition-colors">Demo Pantalla Cocina (KDS)</button></li>
                <li><a href="https://wa.me/51952341165" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1">Soporte WhatsApp <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400">
            <p>© {new Date().getFullYear()} Mi Carta. Todos los derechos reservados.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-neutral-300">Términos de Servicio</span>
              <span className="hover:text-neutral-300">Política de Privacidad</span>
              <span className="hover:text-neutral-300">Seguridad de Datos</span>
            </div>
          </div>

        </div>
      </footer>

      {/* LEAD CAPTURE & FAST ONBOARDING MODAL */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95">
            
            <button
              onClick={() => setIsLeadModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {leadType === 'FOUNDER' ? '✨ Programa 100 Fundadores' : leadType === 'UPLOAD_MENU' ? '📥 Nosotros Cargamos Tu Carta' : '🚀 Prueba Gratis de 30 Días'}
              </span>
              <h3 className="text-xl font-black text-white pt-1">
                {leadType === 'FOUNDER' ? 'Postula como Restaurante Fundador' : leadType === 'UPLOAD_MENU' ? 'Digitalizamos tu Carta Gratis' : 'Activa tu Prueba de Mi Carta'}
              </h3>
              <p className="text-xs text-neutral-400">
                Ingresa los datos de tu negocio y te contactaremos por WhatsApp en minutos.
              </p>
            </div>

            {leadSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">¡Solicitud Enviada con Éxito!</h4>
                <p className="text-xs text-neutral-300">
                  Redirigiendo a WhatsApp para conectar con un asesor especializado...
                </p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Nombre del Restaurante / Negocio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cevichería El Marino"
                    value={leadRestaurantName}
                    onChange={(e) => setLeadRestaurantName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendoza"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 987654321"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Ciudad / Distrito
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Lima, Miraflores"
                      value={leadCity}
                      onChange={(e) => setLeadCity(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 text-xs font-black uppercase tracking-wider text-neutral-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Solicitud Inmediata
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLeadModalOpen(false);
                      onGoToLiveDemo('OWNER');
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-medium"
                  >
                    O explora la Demo Interactiva en Vivo →
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
