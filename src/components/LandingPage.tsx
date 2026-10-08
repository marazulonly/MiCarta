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
  Menu as MenuIcon, 
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
  Check,
  Play,
  Heart,
  MessageCircle,
  Phone,
  Bike
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
    }, 1000);
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
    { name: 'Hamburgueserías', icon: '🍔', tag: 'Combos, salsas y extras', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
    { name: 'Fast Food', icon: '⚡', tag: 'Comandas ultra rápidas a cocina', img: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80' },
    { name: 'Cevicherías', icon: '🐟', tag: 'Nivel de picante y guarniciones', img: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400&q=80' },
    { name: 'Pollerías', icon: '🍗', tag: 'Porciones, ensaladas y delivery', img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&q=80' },
    { name: 'Pizzerías', icon: '🍕', tag: 'Mitad y mitad e ingredientes', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
    { name: 'Dark Kitchens', icon: '🍳', tag: 'Múltiples marcas en una cocina', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&q=80' },
    { name: 'Cafeterías', icon: '☕', tag: 'Bebidas, leches y pastelería', img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80' },
    { name: 'Restaurantes', icon: '🍷', tag: 'Atención en salón y autor', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80' },
    { name: 'Emprendimientos', icon: '🚀', tag: 'Ventas digitales sin comisiones', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80' },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans selection:bg-[#F26522] selection:text-white relative overflow-x-hidden">
      
      {/* 1. HEADER (Limpio, blanco con acentos morados y botón naranja) */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-neutral-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <a href="/carta" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-[#582C84]/10 border border-[#582C84]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <img 
                  src="/huevofrito.svg" 
                  alt="Mi Carta Logo" 
                  className="w-7 h-7 object-contain" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-[#4F2D7F] flex items-center gap-1.5">
                  Mi Carta
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F26522]/10 text-[#F26522] font-black uppercase tracking-wider">
                    SaaS
                  </span>
                </span>
                <span className="text-[11px] text-neutral-500 font-medium -mt-0.5">
                  Sistema de Pedidos para Restaurantes
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-600">
            <button 
              onClick={() => scrollToSection('caracteristicas')} 
              className="hover:text-[#4F2D7F] transition-colors cursor-pointer py-1"
            >
              Características
            </button>
            <button 
              onClick={() => scrollToSection('como-funciona')} 
              className="hover:text-[#4F2D7F] transition-colors cursor-pointer py-1"
            >
              Cómo funciona
            </button>
            <button 
              onClick={() => scrollToSection('planes')} 
              className="hover:text-[#4F2D7F] transition-colors cursor-pointer py-1"
            >
              Planes
            </button>
            <button 
              onClick={() => scrollToSection('fundadores')} 
              className="hover:text-[#4F2D7F] transition-colors cursor-pointer py-1 flex items-center gap-1.5 text-[#F26522] font-bold"
            >
              <Sparkles className="w-4 h-4 text-[#F26522]" />
              100 Fundadores
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="hover:text-[#4F2D7F] transition-colors cursor-pointer py-1"
            >
              Preguntas frecuentes
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-neutral-700 hover:text-[#4F2D7F] hover:bg-[#4F2D7F]/5 transition cursor-pointer"
            >
              Iniciar Sesión
            </button>
            
            <button
              onClick={() => openLeadModal('FREE_TRIAL')}
              className="px-6 py-2.5 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#F26522]/25 hover:shadow-xl hover:shadow-[#F26522]/35 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>PROBAR GRATIS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>

        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-neutral-200 px-6 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-3 text-base font-semibold text-neutral-700">
              <button 
                onClick={() => scrollToSection('caracteristicas')} 
                className="text-left py-1.5 hover:text-[#4F2D7F]"
              >
                Características
              </button>
              <button 
                onClick={() => scrollToSection('como-funciona')} 
                className="text-left py-1.5 hover:text-[#4F2D7F]"
              >
                Cómo funciona
              </button>
              <button 
                onClick={() => scrollToSection('planes')} 
                className="text-left py-1.5 hover:text-[#4F2D7F]"
              >
                Planes
              </button>
              <button 
                onClick={() => scrollToSection('fundadores')} 
                className="text-left py-1.5 text-[#F26522] font-bold flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Programa 100 Fundadores
              </button>
              <button 
                onClick={() => scrollToSection('faq')} 
                className="text-left py-1.5 hover:text-[#4F2D7F]"
              >
                Preguntas frecuentes
              </button>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openLeadModal('FREE_TRIAL');
                }}
                className="w-full py-3 rounded-full bg-[#F26522] text-white text-sm font-black uppercase tracking-wider shadow-md text-center"
              >
                PROBAR GRATIS
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onGoToLogin();
                }}
                className="w-full py-2.5 rounded-full bg-neutral-100 text-neutral-800 text-sm font-bold text-center"
              >
                Acceder al Panel
              </button>
            </div>
          </div>
        )}
      </header>

      {/* BACKGROUND DECORATIVE CIRCLES & ORGANIC SHAPES (Estilo Referencia) */}
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-purple-100/40 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-[30rem] h-[30rem] rounded-full bg-orange-100/40 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-50/60 blur-2xl pointer-events-none -z-10" />

      {/* 1. HERO SECTION (Composición exacta de la imagen de referencia: Izquierda texto morado + botón naranja, Derecha Chef/Restaurante en gran círculo naranja/morado con comida y micro-tarjetas flotantes) */}
      <section className="relative pt-10 pb-20 lg:pt-16 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-left">
              
              {/* Badge Destacado: 0% Comisión */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F26522]/10 border border-[#F26522]/20 text-[#F26522] text-xs font-black uppercase tracking-wider shadow-sm">
                <Percent className="w-3.5 h-3.5" />
                <span>0% DE COMISIÓN POR PEDIDO</span>
              </div>

              {/* Main Headline en Morado Grueso Moderno */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#4F2D7F] tracking-tight leading-[1.1]">
                Tu carta.<br />
                Tus pedidos.<br />
                <span className="text-[#F26522]">Tu restaurante.</span>
              </h1>

              {/* Subtítulo Descriptivo */}
              <p className="text-base sm:text-lg text-neutral-600 font-medium leading-relaxed max-w-xl">
                Convierte tu carta en un sistema completo de pedidos. Tus clientes pueden escanear un QR, elegir sus platos y pedir directamente desde su celular.
              </p>

              {/* Buttons Call-To-Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="px-8 py-4 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#F26522]/30 hover:shadow-2xl hover:shadow-[#F26522]/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3 group"
                >
                  <span>PROBAR GRATIS</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => scrollToSection('como-funciona')}
                  className="px-7 py-4 rounded-full bg-[#4F2D7F]/5 hover:bg-[#4F2D7F]/10 text-[#4F2D7F] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2.5 border border-[#4F2D7F]/15"
                >
                  <div className="w-6 h-6 rounded-full bg-[#4F2D7F] text-white flex items-center justify-center">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </div>
                  <span>VER CÓMO FUNCIONA</span>
                </button>
              </div>

              {/* Feature Highlights Pills */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-neutral-600">
                <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sin descargar aplicaciones</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Comanda directa a cocina</span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Para salón y delivery</span>
                </div>
              </div>

            </div>

            {/* Right Visual Composition (Inspirado en la imagen de referencia: gran círculo de fondo naranja/morado con chef profesional, comida deliciosa y tarjetas flotantes de pedidos en vivo) */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              {/* Decorative Circle Container */}
              <div className="relative w-[340px] sm:w-[440px] lg:w-[480px] h-[340px] sm:h-[440px] lg:h-[480px]">
                
                {/* Background Solid & Gradient Circle */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#F26522] via-[#FF7A00] to-[#FFA048] shadow-2xl overflow-hidden flex items-end justify-center">
                  
                  {/* Decorative dot elements */}
                  <div className="absolute top-6 left-8 w-4 h-4 rounded-full bg-white/40 animate-pulse" />
                  <div className="absolute bottom-16 right-10 w-6 h-6 rounded-full bg-white/30" />
                  
                  {/* Main Chef & Food Portrait */}
                  <img 
                    src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=700&q=85" 
                    alt="Chef Profesional de Restaurante" 
                    className="w-full h-full object-cover object-top scale-105"
                  />
                </div>

                {/* Secondary Decorative Organic Floating Dots (Como en la referencia) */}
                <div className="absolute -top-3 right-12 w-8 h-8 rounded-full bg-[#F26522] border-4 border-white shadow-lg" />
                <div className="absolute bottom-6 left-0 w-6 h-6 rounded-full bg-[#4F2D7F] border-2 border-white shadow-md" />

                {/* Floating Card 1: Smartphone con Pedido Digital (Top Right) */}
                <div className="absolute -top-6 -right-4 sm:-right-6 bg-white p-3.5 sm:p-4 rounded-3xl border border-neutral-100 shadow-[0_15px_35px_rgba(0,0,0,0.1)] flex items-center gap-3 max-w-[220px] animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="w-10 h-10 rounded-2xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-neutral-900">Carta en Móvil</span>
                    <span className="text-[10px] text-neutral-500 font-medium">QR Mesa 04 • Salón</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">En Vivo</span>
                    </div>
                  </div>
                </div>

                {/* Floating Card 2: Comanda en Cocina Recibida (Bottom Left) */}
                <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-white p-3.5 sm:p-4 rounded-3xl border border-neutral-100 shadow-[0_15px_35px_rgba(0,0,0,0.1)] flex items-center gap-3 max-w-[240px] animate-in fade-in slide-in-from-left-4 duration-500">
                  <div className="w-11 h-11 rounded-2xl bg-[#4F2D7F]/10 text-[#4F2D7F] flex items-center justify-center shrink-0">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-neutral-900">Comanda #108</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <span className="text-[10px] text-neutral-500 font-medium">1x Hamburguesa Real</span>
                    <span className="text-[10px] text-[#F26522] font-black">S/ 28.50 • Preparando</span>
                  </div>
                </div>

                {/* Floating Badge 3: Calificación 5 Estrellas (Bottom Right) */}
                <div className="absolute bottom-8 -right-4 bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-full border border-neutral-100 shadow-lg flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <span className="text-xs font-black text-neutral-900">4.9</span>
                  <span className="text-[10px] text-neutral-400 font-medium">(+15k pedidos)</span>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. SECCIÓN “NO ES SOLO UNA CARTA QR” (Composición tipo “Our Special Dishes” de la referencia con 3 grandes tarjetas blancas, comida circular y botones naranja) */}
      <section id="caracteristicas" className="py-20 bg-gradient-to-b from-white via-neutral-50/50 to-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4F2D7F]/10 text-[#4F2D7F] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#4F2D7F]" />
            <span>SISTEMA INTEGRAL DE ATENCIÓN</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4F2D7F] tracking-tight">
            No es solo una carta QR.
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-medium">
            Es el sistema que conecta a tus clientes con todo tu restaurante.
          </p>

          {/* 3 Tarjetas Visuales Grandes (Estilo Dishes de la Referencia) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left">
            
            {/* Card 1: PEDIDOS */}
            <div className="group bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(88,44,132,0.12)] transition-all duration-300 flex flex-col items-center text-center relative pt-16">
              
              {/* Circular Dish Image popping out (Como en la referencia) */}
              <div className="absolute -top-12 w-28 h-28 rounded-full p-1.5 bg-white shadow-xl border border-neutral-100 group-hover:scale-105 transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80" 
                  alt="Pedidos desde Móvil" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {/* Rating & Heart like reference */}
              <div className="w-full flex items-center justify-between text-xs text-neutral-400 font-medium mb-4">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" /> 4.9
                </span>
                <span className="flex items-center gap-1 text-neutral-400">
                  <Heart className="w-3.5 h-3.5 text-[#F26522] fill-[#F26522]" /> 1.8k
                </span>
              </div>

              <h3 className="text-2xl font-black text-[#4F2D7F] mb-2">
                PEDIDOS
              </h3>
              
              <p className="text-sm text-neutral-600 font-medium leading-relaxed mb-6">
                Tus clientes realizan sus pedidos directamente desde su celular sin esperas ni fricción.
              </p>

              <div className="mt-auto w-full pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[11px] text-neutral-400 block font-semibold">Canal</span>
                  <span className="text-sm font-black text-neutral-900">100% Digital</span>
                </div>
                <button 
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="px-4 py-2 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white text-xs font-black transition cursor-pointer shadow-md"
                >
                  Probar Ahora
                </button>
              </div>

            </div>

            {/* Card 2: MESAS (Con Highlight) */}
            <div className="group bg-white rounded-[32px] p-6 sm:p-8 border-2 border-[#4F2D7F]/20 shadow-[0_15px_40px_rgba(88,44,132,0.09)] hover:shadow-[0_22px_50px_rgba(88,44,132,0.15)] transition-all duration-300 flex flex-col items-center text-center relative pt-16">
              
              {/* Circular Dish Image */}
              <div className="absolute -top-12 w-28 h-28 rounded-full p-1.5 bg-white shadow-xl border border-neutral-100 group-hover:scale-105 transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80" 
                  alt="Gestión de Mesas QR" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {/* Rating & Heart */}
              <div className="w-full flex items-center justify-between text-xs text-neutral-400 font-medium mb-4">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" /> 5.0
                </span>
                <span className="flex items-center gap-1 text-neutral-400">
                  <Heart className="w-3.5 h-3.5 text-[#F26522] fill-[#F26522]" /> 3.2k
                </span>
              </div>

              <h3 className="text-2xl font-black text-[#4F2D7F] mb-2">
                MESAS
              </h3>
              
              <p className="text-sm text-neutral-600 font-medium leading-relaxed mb-6">
                El QR puede identificar la mesa y facilitar la atención presencial organizada por salón o terraza.
              </p>

              <div className="mt-auto w-full pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[11px] text-neutral-400 block font-semibold">Ubicación</span>
                  <span className="text-sm font-black text-neutral-900">Mesa y Zona QR</span>
                </div>
                <button 
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="px-4 py-2 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white text-xs font-black transition cursor-pointer shadow-md"
                >
                  Ver Mesas
                </button>
              </div>

            </div>

            {/* Card 3: DELIVERY */}
            <div className="group bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(88,44,132,0.12)] transition-all duration-300 flex flex-col items-center text-center relative pt-16">
              
              {/* Circular Dish Image */}
              <div className="absolute -top-12 w-28 h-28 rounded-full p-1.5 bg-white shadow-xl border border-neutral-100 group-hover:scale-105 transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=300&q=80" 
                  alt="Delivery sin Comisiones" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {/* Rating & Heart */}
              <div className="w-full flex items-center justify-between text-xs text-neutral-400 font-medium mb-4">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" /> 4.9
                </span>
                <span className="flex items-center gap-1 text-neutral-400">
                  <Heart className="w-3.5 h-3.5 text-[#F26522] fill-[#F26522]" /> 2.1k
                </span>
              </div>

              <h3 className="text-2xl font-black text-[#4F2D7F] mb-2">
                DELIVERY
              </h3>
              
              <p className="text-sm text-neutral-600 font-medium leading-relaxed mb-6">
                Recibe y controla pedidos para delivery desde el mismo sistema, con 0% de comisión por venta.
              </p>

              <div className="mt-auto w-full pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[11px] text-neutral-400 block font-semibold">Comisión</span>
                  <span className="text-sm font-black text-emerald-600">0% Comisión</span>
                </div>
                <button 
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="px-4 py-2 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white text-xs font-black transition cursor-pointer shadow-md"
                >
                  Ver Delivery
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. SECCIÓN “TODO TU RESTAURANTE CONECTADO” (Inspirada en “Discover Our Offerings” de la referencia con 5 elementos en línea horizontal conectada y círculos ilustrados) */}
      <section id="como-funciona" className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F26522]/10 text-[#F26522] text-xs font-black uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-[#F26522]" />
            <span>FLUJO EN TIEMPO REAL</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4F2D7F] tracking-tight">
            Todo tu restaurante conectado.
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-medium">
            Desde que el cliente realiza el pedido hasta que recibe su comida, todos saben qué está pasando.
          </p>

          {/* Connected Flow Line (5 Elementos con Círculos Ilustrados y Flechas Discontinuas) */}
          <div className="pt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative">
            
            {/* Element 1: CLIENTE */}
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-20 h-20 rounded-full bg-[#582C84]/10 border-2 border-[#582C84]/20 flex items-center justify-center text-3xl shadow-md group-hover:scale-110 group-hover:bg-[#582C84] group-hover:text-white transition-all duration-300">
                📱
              </div>
              <span className="text-xs font-black text-[#F26522] uppercase tracking-wider">Paso 01</span>
              <h4 className="text-lg font-black text-[#4F2D7F]">CLIENTE</h4>
              <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-[200px]">
                Escanea el QR, explora la carta con fotos y envía su orden en segundos.
              </p>
            </div>

            {/* Element 2: MESA */}
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-20 h-20 rounded-full bg-[#F26522]/10 border-2 border-[#F26522]/20 flex items-center justify-center text-3xl shadow-md group-hover:scale-110 group-hover:bg-[#F26522] group-hover:text-white transition-all duration-300">
                🍽️
              </div>
              <span className="text-xs font-black text-[#F26522] uppercase tracking-wider">Paso 02</span>
              <h4 className="text-lg font-black text-[#4F2D7F]">MESA</h4>
              <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-[200px]">
                El sistema identifica la mesa y zona exacta sin equivocaciones ni confusiones.
              </p>
            </div>

            {/* Element 3: COCINA */}
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-20 h-20 rounded-full bg-[#582C84]/10 border-2 border-[#582C84]/20 flex items-center justify-center text-3xl shadow-md group-hover:scale-110 group-hover:bg-[#582C84] group-hover:text-white transition-all duration-300">
                👨‍🍳
              </div>
              <span className="text-xs font-black text-[#F26522] uppercase tracking-wider">Paso 03</span>
              <h4 className="text-lg font-black text-[#4F2D7F]">COCINA</h4>
              <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-[200px]">
                La comanda entra a la pantalla de cocina organizada por tiempo de preparación.
              </p>
            </div>

            {/* Element 4: DELIVERY */}
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-20 h-20 rounded-full bg-[#F26522]/10 border-2 border-[#F26522]/20 flex items-center justify-center text-3xl shadow-md group-hover:scale-110 group-hover:bg-[#F26522] group-hover:text-white transition-all duration-300">
                🛵
              </div>
              <span className="text-xs font-black text-[#F26522] uppercase tracking-wider">Paso 04</span>
              <h4 className="text-lg font-black text-[#4F2D7F]">DELIVERY</h4>
              <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-[200px]">
                Despacho a domicilio con dirección, WhatsApp del cliente y panel para repartidores.
              </p>
            </div>

            {/* Element 5: DUEÑO */}
            <div className="flex flex-col items-center text-center space-y-3 relative group">
              <div className="w-20 h-20 rounded-full bg-[#582C84]/10 border-2 border-[#582C84]/20 flex items-center justify-center text-3xl shadow-md group-hover:scale-110 group-hover:bg-[#582C84] group-hover:text-white transition-all duration-300">
                👨‍💼
              </div>
              <span className="text-xs font-black text-[#F26522] uppercase tracking-wider">Paso 05</span>
              <h4 className="text-lg font-black text-[#4F2D7F]">DUEÑO</h4>
              <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-[200px]">
                Panel de control en vivo con métricas de ventas, platos top y mesas activas.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SECCIÓN DE FUNCIONES (Tarjetas visuales limpias con microinteracciones y acentos morado/naranja) */}
      <section className="py-20 bg-neutral-50/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4F2D7F]/10 text-[#4F2D7F] text-xs font-black uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-[#4F2D7F]" />
            <span>HERRAMIENTAS POTENTES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4F2D7F] tracking-tight">
            Todo lo que necesitas para vender mejor.
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-medium">
            Diseñado especialmente para la dinámica real de un restaurante en horas punta.
          </p>

          {/* 12 Feature Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-12 text-left">
            
            {[
              { icon: Smartphone, title: 'Carta Digital', desc: 'Diseño responsive y rápido sin descargas.' },
              { icon: QrCode, title: 'QR por Mesa', desc: 'Identificación automática de salón o terraza.' },
              { icon: ShoppingBag, title: 'Pedidos en Móvil', desc: 'El cliente pide directo y cocina prepara.' },
              { icon: Flame, title: 'Adicionales', desc: 'Salsas extras, guarniciones y tamaños.' },
              { icon: Sparkles, title: 'Observaciones', desc: 'Notas de preparación ("sin cebolla").' },
              { icon: Store, title: 'Gestión de Mesas', desc: 'Control de ocupación y cuentas abiertas.' },
              { icon: ChefHat, title: 'Panel de Cocina', desc: 'Pantalla KDS en tiempo real con tiempos.' },
              { icon: Users, title: 'Panel Meseros', desc: 'Atención ágil de llamadas y pedidos.' },
              { icon: Truck, title: 'Módulo Delivery', desc: 'Cálculo de envíos y datos de cliente.' },
              { icon: Activity, title: 'Seguimiento Vivo', desc: 'El cliente ve el estado de su comida.' },
              { icon: Clock, title: 'Horarios', desc: 'Apertura y cierre programable de carta.' },
              { icon: TrendingUp, title: 'Estadísticas', desc: 'Ventas del día, platos más vendidos.' }
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(88,44,132,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col space-y-2.5"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#582C84]/10 text-[#4F2D7F] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-black text-[#4F2D7F]">{f.title}</h4>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              );
            })}

          </div>

        </div>
      </section>

      {/* 5. SECCIÓN PARA TIPOS DE NEGOCIO (Tarjetas flotantes circulares / food tech) */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F26522]/10 text-[#F26522] text-xs font-black uppercase tracking-wider">
            <Store className="w-3.5 h-3.5 text-[#F26522]" />
            <span>ADAPTABLE A CUALQUIER FORMATO</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4F2D7F] tracking-tight">
            Hecho para tu negocio.
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-medium">
            Personaliza categorías, adicionales y canales según el estilo de tu cocina.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 pt-12 text-left">
            {businessTypes.map((b, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(88,44,132,0.1)] transition-all flex items-center gap-4 group"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-neutral-100 group-hover:scale-105 transition-transform">
                  <img src={b.img} alt={b.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{b.icon}</span>
                    <h4 className="text-base font-black text-[#4F2D7F]">{b.name}</h4>
                  </div>
                  <span className="text-xs text-neutral-500 font-medium">{b.tag}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. SECCIÓN DE PLANES (Diseño claro, blanco, sin tablas aburridas, con toggle de facturación y 0% comisión) */}
      <section id="planes" className="py-24 bg-gradient-to-b from-neutral-50/80 via-white to-neutral-50/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4F2D7F]/10 text-[#4F2D7F] text-xs font-black uppercase tracking-wider">
            <BadgeCheck className="w-3.5 h-3.5 text-[#4F2D7F]" />
            <span>TARIFAS TRANSPARENTES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4F2D7F] tracking-tight">
            Empieza a vender digitalmente.
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-medium">
            Elige el plan ideal para tu restaurante. Sin contratos forzosos ni comisiones por comanda.
          </p>

          {/* Destacado 0% Comisión */}
          <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-black shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>0% de comisión por pedido • El 100% de tus ventas es tuyo</span>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 pt-6">
            <div className="bg-white p-1.5 rounded-full border border-neutral-200 shadow-sm flex items-center">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-5 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-[#4F2D7F] text-white shadow-md'
                    : 'text-neutral-600 hover:text-[#4F2D7F]'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-5 py-2 rounded-full text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-[#F26522] text-white shadow-md'
                    : 'text-neutral-600 hover:text-[#F26522]'
                }`}
              >
                <span>Anual</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-black">
                  2 meses gratis
                </span>
              </button>
            </div>
          </div>

          {/* 3 Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-10 text-left max-w-6xl mx-auto items-stretch">
            
            {/* Plan 1: EMPRENDE */}
            <div className="bg-white rounded-[32px] p-8 border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between relative">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Plan Inicial</span>
                  <h3 className="text-2xl font-black text-[#4F2D7F]">EMPRENDE</h3>
                  <p className="text-xs text-neutral-500 font-medium mt-1">Para empezar a recibir pedidos.</p>
                </div>

                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-neutral-900">
                      {billingCycle === 'MONTHLY' ? 'S/ 49' : 'S/ 39'}
                    </span>
                    <span className="text-xs font-bold text-neutral-500">/ mes</span>
                  </div>
                  {billingCycle === 'ANNUAL' && (
                    <span className="text-[11px] text-emerald-600 font-bold">Facturado anualmente (S/ 468/año)</span>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-700">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Carta interactiva solo texto</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Enlace directo para redes y bio</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Código QR digital descargable</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Recepción de pedidos por Whatsapp</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Módulo de pedidos para Delivery</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>25 Platos y adicionales ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Horarios y configuración del local</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="w-full py-3.5 rounded-full bg-neutral-100 hover:bg-[#4F2D7F] hover:text-white text-[#4F2D7F] font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  ELEGIR EMPRENDE
                </button>
              </div>
            </div>

            {/* Plan 2: NEGOCIO (MÁS ELEGIDO) */}
            <div className="bg-white rounded-[32px] p-8 border-2 border-[#F26522] shadow-[0_20px_50px_rgba(242,101,34,0.15)] hover:shadow-[0_25px_60px_rgba(242,101,34,0.22)] transition-all flex flex-col justify-between relative scale-105 z-10">
              
              {/* Badge Más Elegido */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F26522] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                MÁS ELEGIDO
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#F26522]">Para Restaurantes</span>
                  <h3 className="text-2xl font-black text-[#4F2D7F]">NEGOCIO</h3>
                  <p className="text-xs text-neutral-500 font-medium mt-1">Para controlar tu restaurante completo.</p>
                </div>

                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-neutral-900">
                      {billingCycle === 'MONTHLY' ? 'S/ 89' : 'S/ 72'}
                    </span>
                    <span className="text-xs font-bold text-neutral-500">/ mes</span>
                  </div>
                  {billingCycle === 'ANNUAL' && (
                    <span className="text-[11px] text-emerald-600 font-bold">Facturado anualmente (S/ 864/año)</span>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-700">
                  <div className="flex items-center gap-2.5 font-bold text-[#4F2D7F]">
                    <Check className="w-4 h-4 text-[#F26522] shrink-0" />
                    <span>Todo lo del plan Emprende</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#F26522] shrink-0" />
                    <span>QR inteligente por mesa y salón</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#F26522] shrink-0" />
                    <span>Gestión de mesas y zonas en vivo</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#F26522] shrink-0" />
                    <span>60 Platos, fotos y adicionales ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#F26522] shrink-0" />
                    <span>Panel de atención para Meseros</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#F26522] shrink-0" />
                    <span>Seguimiento de pedidos en tiempo real</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#F26522] shrink-0" />
                    <span>Estadísticas de ventas diarias</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="w-full py-4 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xl shadow-[#F26522]/30 active:scale-95"
                >
                  PROBAR GRATIS (NEGOCIO)
                </button>
              </div>
            </div>

            {/* Plan 3: PROFESIONAL */}
            <div className="bg-white rounded-[32px] p-8 border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between relative">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-400">Grandes Operaciones</span>
                  <h3 className="text-2xl font-black text-[#4F2D7F]">PROFESIONAL</h3>
                  <p className="text-xs text-neutral-500 font-medium mt-1">Para operaciones más completas.</p>
                </div>

                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-neutral-900">
                      {billingCycle === 'MONTHLY' ? 'S/ 129' : 'S/ 107'}
                    </span>
                    <span className="text-xs font-bold text-neutral-500">/ mes</span>
                  </div>
                  {billingCycle === 'ANNUAL' && (
                    <span className="text-[11px] text-emerald-600 font-bold">Facturado anualmente (S/ 1,290/año)</span>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-700">
                  <div className="flex items-center gap-2.5 font-bold text-[#4F2D7F]">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Todo lo del plan Negocio</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Usuarios y roles avanzados ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Panel móvil para Repartidores</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Estadísticas avanzadas y métricas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Personalización de marca y colores</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Soporte prioritario por WhatsApp</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => openLeadModal('FREE_TRIAL')}
                  className="w-full py-3.5 rounded-full bg-neutral-100 hover:bg-[#4F2D7F] hover:text-white text-[#4F2D7F] font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  ELEGIR PROFESIONAL
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. SECCIÓN LANZAMIENTO (Programa 100 Restaurantes Fundadores - Alto Impacto Naranja y Morado) */}
      <section id="fundadores" className="py-20 bg-gradient-to-r from-[#4F2D7F] to-[#5B21B6] text-white relative overflow-hidden">
        
        {/* Decorative Circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#F26522]/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-purple-900/50 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-8 space-y-6 text-left">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#FFA048] text-xs font-black uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-[#FFA048]" />
                <span>PROGRAMA EXCLUSIVO DE LANZAMIENTO</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Sé uno de los primeros restaurantes en usar Mi Carta.
              </h2>
              
              <p className="text-base sm:text-lg text-purple-100 font-medium leading-relaxed max-w-2xl">
                Accede a beneficios únicos creados para los 100 primeros locales gastronómicos que digitalicen su carta con nosotros.
              </p>

              {/* 6 Fundadores Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {[
                  'Primer mes a mitad de precio',
                  'Configuración inicial asistida por expertos',
                  'Códigos QR personalizados en alta definición',
                  'Capacitación guiada para todo tu equipo',
                  'Soporte directo prioritario por WhatsApp',
                  'Precio fundador congelado durante 12 meses'
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white/95">
                    <CheckCircle2 className="w-4 h-4 text-[#FFA048] shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={() => openLeadModal('FOUNDER')}
                  className="px-8 py-4 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-[#F26522]/50 hover:shadow-orange-600/60 active:scale-95 transition-all cursor-pointer flex items-center gap-3"
                >
                  <span>QUIERO SER RESTAURANTE FUNDADOR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Right Badge Illustration */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-64 h-64 rounded-full bg-white/10 border-4 border-white/20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-[#F26522] text-white flex items-center justify-center mb-2 shadow-lg">
                  <Flame className="w-8 h-8" />
                </div>
                <span className="text-4xl font-black text-white tracking-tight">100</span>
                <span className="text-xs font-black text-[#FFA048] uppercase tracking-wider">Cupos Fundadores</span>
                <span className="text-[11px] text-purple-200 mt-1 font-medium">Activa tu restaurante hoy</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. SECCIÓN “NOSOTROS CARGAMOS TU CARTA” (Composición similar a la sección testimonial/chef de la referencia con círculo grande y detalles) */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Circular Visual Presentation (Como en la referencia de reviews/chef) */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-[300px] sm:w-[380px] h-[300px] sm:h-[380px]">
                
                {/* Yellow/Orange Accent Circle */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#FFA048] to-[#F26522] shadow-xl overflow-hidden flex items-end justify-center">
                  <img 
                    src="/alexisgonzales.jpg" 
                    alt="Chef Alexis Gonzales - Mi Carta" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Floating WhatsApp upload badge */}
                <div className="absolute -bottom-4 right-2 bg-white px-4 py-3 rounded-2xl border border-neutral-100 shadow-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-black text-neutral-900">Envíanos tu Menú</span>
                    <span className="text-[10px] text-neutral-500 font-medium">Fotos o PDF por WhatsApp</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Text Block */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4F2D7F]/10 text-[#4F2D7F] text-xs font-black uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5 text-[#4F2D7F]" />
                <span>SERVICIO DE MIGRACIÓN SIN COSTO</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4F2D7F] tracking-tight leading-tight">
                ¿No tienes tiempo para configurar tu carta?
              </h2>
              
              <p className="text-base sm:text-lg text-neutral-600 font-medium leading-relaxed">
                Envíanos tus platos, fotos, precios y adicionales. Te ayudamos a convertirlos en una carta digital lista para recibir pedidos sin que tengas que escribir plato por plato.
              </p>

              <div className="space-y-3 text-xs sm:text-sm font-semibold text-neutral-700">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Carga de platos con nombres, descripciones y precios</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Configuración de opciones (términos de carne, salsas, guarniciones)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Generación de tus códigos QR listos para imprimir</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => openLeadModal('UPLOAD_MENU')}
                  className="px-8 py-4 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#F26522]/30 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <span>QUIERO MI CARTA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 9. TESTIMONIOS (Estructura visual lista con placeholders transparentes y elegantes) */}
      <section className="py-20 bg-neutral-50/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4F2D7F]/10 text-[#4F2D7F] text-xs font-black uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>EXPERIENCIAS REALES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4F2D7F] tracking-tight">
            Lo que dicen nuestros restaurantes
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-medium">
            Historias de propietarios y equipos que transformaron la atención en mesa y delivery.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left">
            {[
              {
                name: 'Carlos Mendoza',
                role: 'Dueño de Hamburguesería',
                rest: 'La Frita Burger & Bar',
                img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
                quote: '“El tiempo entre que el cliente se sienta y la cocina empieza a preparar bajó de 12 minutos a menos de 2 minutos. Cero pedidos equivocados.”',
                rating: 5
              },
              {
                name: 'Mariana Silva',
                role: 'Gerente General',
                rest: 'Cevichería Puerto Azul',
                img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
                quote: '“Los adicionales de picante y guarnición aumentaron nuestro ticket promedio en un 18%. Y lo mejor: no pagamos comisiones abusivas por pedido.”',
                rating: 5
              },
              {
                name: 'Jorge Ramos',
                role: 'Fundador',
                rest: 'Trattoria & Pizza Nostra',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
                quote: '“Pudimos gestionar salón y delivery desde un solo panel sin tener que comprar máquinas caras. Funciona perfecto en cualquier celular.”',
                rating: 5
              }
            ].map((t, idx) => (
              <div 
                key={idx}
                className="bg-white p-8 rounded-[32px] border border-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed italic">
                    {t.quote}
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-neutral-100">
                  <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[#4F2D7F]">{t.name}</span>
                    <span className="text-xs text-neutral-500 font-medium">{t.role} • {t.rest}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 10. PREGUNTAS FRECUENTES (FAQ Acordeón) */}
      <section id="faq" className="py-20 bg-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4F2D7F]/10 text-[#4F2D7F] text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#4F2D7F]" />
            <span>RESPUESTAS CLARAS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#4F2D7F] tracking-tight">
            Preguntas frecuentes
          </h2>
          
          <p className="text-base sm:text-lg text-neutral-600 font-medium">
            Todo lo que necesitas saber antes de empezar con Mi Carta.
          </p>

          <div className="pt-10 space-y-3 text-left">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition cursor-pointer"
                  >
                    <span className="text-base font-black text-[#4F2D7F]">
                      {faq.q}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                      isOpen ? 'bg-[#F26522] text-white rotate-180' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-neutral-600 font-medium leading-relaxed border-t border-neutral-100 bg-neutral-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 11. CTA FINAL (Visualmente potente en morado/naranja con botón grande de alta conversión) */}
      <section className="py-24 bg-gradient-to-tr from-[#3B1C54] via-[#4F2D7F] to-[#582C84] text-white relative overflow-hidden text-center">
        
        {/* Background Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#F26522]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#FFA048]/20 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#FFA048] text-xs font-black uppercase tracking-wider backdrop-blur-sm">
            <Flame className="w-4 h-4 text-[#FFA048]" />
            <span>EMPIEZA HOY MISMO</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Haz que tu carta empiece a recibir pedidos.
          </h2>
          
          <p className="text-lg sm:text-xl text-purple-100 font-medium max-w-2xl mx-auto">
            Menos pedidos manuales. Menos errores. Más control.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openLeadModal('FREE_TRIAL')}
              className="w-full sm:w-auto px-10 py-5 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-[#F26522]/50 hover:shadow-orange-600/70 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3"
            >
              <span>PROBAR MI CARTA GRATIS</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-8 py-5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-sm border border-white/20 transition cursor-pointer"
            >
              Acceso a Mi Cuenta
            </button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-purple-200 font-semibold">
            <span>✓ 0% Comisión</span>
            <span>✓ Sin tarjeta de crédito</span>
            <span>✓ Listo en 24 horas</span>
          </div>

        </div>
      </section>

      {/* 12. FOOTER (Limpio, elegante, coherente con la identidad) */}
      <footer className="bg-white border-t border-neutral-100 py-12 text-neutral-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
            
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <img src="/huevofrito.svg" alt="Mi Carta Logo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-black text-[#4F2D7F] tracking-tight">Mi Carta</span>
              </div>
              <p className="text-xs text-neutral-500 font-medium max-w-sm leading-relaxed">
                Tu carta. Tus pedidos. Tu restaurante. El sistema moderno para transformar tu menú en pedidos digitales directos a cocina y delivery sin comisiones.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Navegación</h5>
              <ul className="space-y-2 text-xs font-medium text-neutral-600">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#4F2D7F]">Inicio</button></li>
                <li><button onClick={() => scrollToSection('caracteristicas')} className="hover:text-[#4F2D7F]">Características</button></li>
                <li><button onClick={() => scrollToSection('como-funciona')} className="hover:text-[#4F2D7F]">Cómo funciona</button></li>
                <li><button onClick={() => scrollToSection('planes')} className="hover:text-[#4F2D7F]">Planes</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-[#4F2D7F]">Preguntas frecuentes</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Contacto y Soporte</h5>
              <ul className="space-y-2 text-xs font-medium text-neutral-600">
                <li>
                  <a 
                    href="https://wa.me/51952341165?text=Hola%20Mi%20Carta,%20deseo%20informaci%C3%B3n" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-emerald-600 font-bold hover:underline"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp: +51 952 341 165</span>
                  </a>
                </li>
                <li><span className="text-neutral-500">Lima, Perú</span></li>
                <li><button onClick={onGoToLogin} className="text-[#4F2D7F] font-bold hover:underline">Panel de Administración →</button></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
            <span>© {new Date().getFullYear()} Mi Carta. Todos los derechos reservados.</span>
            <div className="flex gap-4">
              <span className="hover:text-neutral-600 cursor-pointer">Términos</span>
              <span>•</span>
              <span className="hover:text-neutral-600 cursor-pointer">Privacidad</span>
              <span>•</span>
              <span className="hover:text-neutral-600 cursor-pointer">0% Comisión</span>
            </div>
          </div>

        </div>
      </footer>

      {/* LEAD CAPTURE MODAL (Funciona realmente para "PROBAR GRATIS", "QUIERO SER RESTAURANTE FUNDADOR", "QUIERO MI CARTA") */}
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-6 sm:p-8 border border-neutral-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsLeadModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-left space-y-4">
              
              <div className="w-12 h-12 rounded-2xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-[#4F2D7F]">
                  {leadType === 'FOUNDER' 
                    ? 'Programa 100 Fundadores' 
                    : leadType === 'UPLOAD_MENU' 
                    ? 'Subimos tu Carta Gratis' 
                    : 'Prueba Mi Carta Gratis'}
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">
                  Déjanos los datos de tu restaurante y te contactaremos por WhatsApp en minutos.
                </p>
              </div>

              {leadSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-black text-emerald-900">¡Solicitud Recibida!</h4>
                  <p className="text-xs text-emerald-700 font-medium">
                    Abriendo WhatsApp para coordinar la activación de tu carta...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 block mb-1">Nombre del Restaurante *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Hamburguesería Don Mario"
                      value={leadRestaurantName}
                      onChange={(e) => setLeadRestaurantName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-[#4F2D7F] focus:ring-1 focus:ring-[#4F2D7F]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-700 block mb-1">Tu Nombre o Cargo</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Mario (Dueño)"
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-[#4F2D7F] focus:ring-1 focus:ring-[#4F2D7F]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-700 block mb-1">WhatsApp / Teléfono *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="Ej: 952 341 165"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-[#4F2D7F] focus:ring-1 focus:ring-[#4F2D7F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-700 block mb-1">Ciudad o Distrito</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Lima, Miraflores / Arequipa"
                      value={leadCity}
                      onChange={(e) => setLeadCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-[#4F2D7F] focus:ring-1 focus:ring-[#4F2D7F]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-full bg-[#F26522] hover:bg-[#d95314] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#F26522]/30 active:scale-95 flex items-center justify-center gap-2 mt-2"
                  >
                    <span>CONTINUAR POR WHATSAPP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] text-center text-neutral-400">
                    🔒 Tus datos están 100% protegidos. Sin compromiso ni spam.
                  </p>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
