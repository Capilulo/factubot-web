/** Configuración trámite web Boqi Firmas (sin secretos en repo). */
window.BOQI_SOLICITAR = {
  /** FormSubmit entrega a este correo (mismo que contacto Boqi). */
  notifyEmail: "pauldavila1992@gmail.com",
  ivaRate: 0.15,
  whatsappE164: "593963173441",
  /** Precios sin IVA — alineados a MEMORY.md */
  planes: {
    pn1: { label: "Persona natural / Rep. legal — 1 año", subtotal: 18 },
    pn2: { label: "Persona natural / Rep. legal — 2 años", subtotal: 28, destacado: true },
    pn3: { label: "Persona natural / Rep. legal — 3 años", subtotal: 37 },
    pn4: { label: "Persona natural / Rep. legal — 4 años", subtotal: 46 },
    pn5: { label: "Persona natural / Rep. legal — 5 años", subtotal: 54 },
    combo1: { label: "Suscriptor general — Combo 1 año (P12 + nube)", subtotal: 19 },
    combo5: { label: "Suscriptor general — Combo 5 años", subtotal: 55 },
    corta: { label: "Firma corta 7 o 30 días", subtotal: 6.99 },
  },
};
