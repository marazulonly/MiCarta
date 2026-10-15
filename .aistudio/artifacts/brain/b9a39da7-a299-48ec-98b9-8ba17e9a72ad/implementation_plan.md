# Informe y Plan: Sincronización Visual Exacta entre Cartas Públicas y el Editor de Plantillas

## 1. Resumen y Objetivo

Este informe detalla el análisis arquitectónico, las ventajas, desventajas, limitaciones técnicas y el plan paso a paso necesario para garantizar que las cartas públicas que ven los clientes en sus dispositivos (`/?r=slug`) se rendericen con **exacta fidelidad visual 1:1** respecto a lo diseñado y previsualizado en el editor de plantillas del panel de administración.

---

## 2. Lo que Se Puede y No Se Puede Hacer

### ✅ Lo que SÍ se puede hacer:
1. **Herencia de Plantilla y Estilos:** Sincronizar el campo `templateId` (ej. `classic`, `modern`, `minimal`, `neon`, `gourmet`) y las opciones de branding (`primaryColor`, `fontFamily`, `headerLogoUrl`, `bannerUrl`) guardadas en el documento del restaurante y la instantánea pública (`published_menus`).
2. **Sistema de Temas Dinámicos:** Aplicar clases de Tailwind o variables CSS dinámicas basadas en la plantilla seleccionada para que colores de acento, fondos, tipografías y bordes coincidan exactamente con la previsualización del editor.
3. **Estructura de Categorías y Platos:** Renderizar las pestañas de categorías, la disposición de la parrilla o lista de platos, insignias (picante, vegetariano, popular), descripciones, precios y adicionales con los mismos componentes visuales que usa el editor.

### ❌ Lo que NO se puede hacer (Limitaciones Técnicas):
1. **Posicionamiento Manual Absoluto (Drag-and-Drop Libre de Píxeles):** Si el editor permite arrastrar elementos libremente por coordenadas X/Y en un lienzo infinito (tipo Canva), esto es extremadamente frágil y poco responsivo en móviles. Las cartas públicas deben basarse en **diseños estructurados y responsivos**, no en posicionamiento absoluto rígido.
2. **Fuentes Personalizadas No Soportadas:** Cargar fuentes externas arbitrarias sin asegurar que estén importadas globalmente en el index.html o mediante Google Fonts dinámicas.
3. **Interactividad de Edición en la Vista Pública:** La vista pública es estrictamente de lectura y pedidos (comensales), por lo que controles de edición, botones de arrastrar y menús flotantes del administrador no deben aparecer.

---

## 3. Ventajas y Desventajas

### 🌟 Ventajas:
- **Consistencia de Marca:** El cliente final experimenta exactamente el diseño profesional que el dueño configuró, mejorando la percepción de calidad.
- **Fidelidad Visual:** Se elimina la discrepancia entre "cómo se ve en el editor" y "cómo lo ve el cliente en su celular".
- **Reutilización de Componentes:** Al compartir los mismos motores de renderizado de plantillas tanto en el editor como en la vista pública, se simplifica el mantenimiento del código.

### ⚠️ Desventajas y Riesgos:
- **Complejidad de CSS Dinámico:** Requiere un motor robusto de inyección de estilos por cada plantilla para manejar colores personalizados sin romper la accesibilidad (contraste de texto).
- **Peso de Carga:** Si las plantillas cargan muchas hojas de estilo o fuentes pesadas, puede ralentizar la velocidad de apertura de la carta en dispositivos móviles con mala conexión.

---

## 4. Plan de Acción Técnico para la Sincronización 1:1

```
┌────────────────────────────────────────┐
│ Editor de Plantillas (Admin)           │
│ Configura: Template ID, Colores, Logo  │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│ Persistencia Firestore                 │
│ restaurants/{slug} & published_menus   │
└───────────────────┬────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│ Vista Pública (Client App /?r=slug)    │
│ Aplica Theme Engine & Estilos Dinámicos│
└────────────────────────────────────────┘
```

### Fases del Plan:
1. **Auditoría de Propiedades de Plantilla:** Unificar la interfaz de configuración de plantillas para que cada propiedad visual (`templateId`, `branding`, `primaryColor`, `fontFamily`) se guarde consistentemente en la estructura del restaurante.
2. **Motor de Renderizado Unificado:** Refactorizar el componente de visualización pública para que utilice los mismos renderizadores de plantillas del editor en lugar de plantillas hardcodeadas separadas.
3. **Inyección Segura de Variables CSS:** Aplicar estilos en línea controlados (`style={{ '--primary-color': rest.branding.primaryColor } as any}`) para respetar la paleta elegida por el usuario.
4. **Pruebas Multi-Dispositivo:** Validar el comportamiento responsivo en móviles y tablets para cada una de las plantillas soportadas.
