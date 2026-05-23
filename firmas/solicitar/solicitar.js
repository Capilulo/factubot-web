(function () {
  const cfg = window.BOQI_SOLICITAR || {};
  const IVA = cfg.ivaRate ?? 0.15;

  const steps = Array.from(document.querySelectorAll("[data-step]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnSubmit = document.getElementById("btn-submit");
  const form = document.getElementById("solicitud-form");
  const planSelect = document.getElementById("plan");
  const resumenBox = document.getElementById("resumen");
  const refDisplay = document.getElementById("ref-pedido");
  const totalDisplay = document.getElementById("total-iva");

  let stepIndex = 0;
  let refPedido = "";

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function planPrice(id) {
    const p = cfg.planes?.[id];
    if (!p) return null;
    const sub = p.subtotal;
    const iva = sub * IVA;
    return { ...p, sub, iva, total: sub + iva };
  }

  function fillPlans() {
    if (!planSelect) return;
    planSelect.innerHTML = '<option value="">Selecciona un plan</option>';
    Object.entries(cfg.planes || {}).forEach(([id, p]) => {
      const pr = planPrice(id);
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = `${p.label} — ${money(pr.sub)} + IVA (${money(pr.total)} total)`;
      if (p.destacado) opt.selected = false;
      planSelect.appendChild(opt);
    });
    const def = planSelect.querySelector('[value="pn2"]');
    if (def) def.selected = true;
  }

  function genRef() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const r = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `BOQI-FIR-${y}${m}${day}-${r}`;
  }

  function showPanel(i) {
    stepIndex = Math.max(0, Math.min(i, panels.length - 1));
    panels.forEach((p, idx) => p.classList.toggle("hidden", idx !== stepIndex));
    steps.forEach((s, idx) => {
      s.classList.toggle("text-brand", idx <= stepIndex);
      s.classList.toggle("border-brand", idx === stepIndex);
      s.classList.toggle("border-white/20", idx !== stepIndex);
    });
    btnPrev.classList.toggle("hidden", stepIndex === 0);
    btnNext.classList.toggle("hidden", stepIndex === panels.length - 1);
    btnSubmit.classList.toggle("hidden", stepIndex !== panels.length - 1);
    if (stepIndex === panels.length - 1) updateResumen();
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function validateStep() {
    const msg = document.getElementById("form-error");
    if (msg) msg.textContent = "";

    if (stepIndex === 0) {
      const tipo = document.querySelector('input[name="tipo"]:checked');
      if (!tipo) {
        if (msg) msg.textContent = "Selecciona persona natural o representante legal.";
        return false;
      }
    }
    if (stepIndex === 1) {
      if (!val("nombres") || !val("cedula") || !val("email") || !val("telefono")) {
        if (msg) msg.textContent = "Completa nombres, cédula, email y teléfono.";
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("email"))) {
        if (msg) msg.textContent = "Email no válido.";
        return false;
      }
    }
    if (stepIndex === 2) {
      if (!planSelect?.value) {
        if (msg) msg.textContent = "Elige un plan de vigencia.";
        return false;
      }
    }
    if (stepIndex === 3) {
      const cedulaF = document.getElementById("doc-cedula-frente");
      const cedulaR = document.getElementById("doc-cedula-reverso");
      const selfie = document.getElementById("doc-selfie");
      if (!cedulaF?.files?.length || !cedulaR?.files?.length || !selfie?.files?.length) {
        if (msg) msg.textContent = "Sube cédula (frente y reverso) y selfie con cédula visible.";
        return false;
      }
      if (!document.getElementById("consent-datos")?.checked || !document.getElementById("consent-tratamiento")?.checked) {
        if (msg) msg.textContent = "Debes aceptar consentimiento y política de privacidad.";
        return false;
      }
    }
    return true;
  }

  function updateResumen() {
    refPedido = genRef();
    const pr = planPrice(planSelect.value);
    if (refDisplay) refDisplay.textContent = refPedido;
    if (totalDisplay && pr) totalDisplay.textContent = money(pr.total);
    if (resumenBox && pr) {
      resumenBox.innerHTML = `
        <p><strong>Referencia:</strong> ${refPedido}</p>
        <p><strong>Plan:</strong> ${pr.label}</p>
        <p><strong>Subtotal:</strong> ${money(pr.sub)} · <strong>IVA (${Math.round(IVA * 100)}%):</strong> ${money(pr.iva)}</p>
        <p class="text-lg font-semibold text-brand"><strong>Total a pagar:</strong> ${money(pr.total)}</p>
        <p class="mt-2 text-sm text-white/60">Tras enviar, recibirás confirmación por correo. Incluye la referencia <strong>${refPedido}</strong> en la transferencia.</p>
      `;
    }
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!validateStep()) return;

    const btn = btnSubmit;
    const status = document.getElementById("submit-status");
    btn.disabled = true;
    if (status) status.textContent = "Enviando solicitud segura…";

    const pr = planPrice(planSelect.value);
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value || "";

    const fd = new FormData();
    fd.append("_subject", `Solicitud firma Boqi ${refPedido}`);
    fd.append("_captcha", "false");
    fd.append("_template", "table");
    fd.append("referencia", refPedido);
    fd.append("tipo_solicitante", tipo);
    fd.append("nombres", val("nombres"));
    fd.append("cedula", val("cedula"));
    fd.append("email", val("email"));
    fd.append("telefono", val("telefono"));
    fd.append("plan", pr?.label || planSelect.value);
    fd.append("subtotal_usd", String(pr?.sub ?? ""));
    fd.append("total_con_iva_usd", String(pr?.total ?? ""));
    fd.append("mensaje_rl", val("mensaje-rl") || "");

    ["doc-cedula-frente", "doc-cedula-reverso", "doc-selfie"].forEach((id) => {
      const f = document.getElementById(id)?.files?.[0];
      if (f) fd.append(id.replace("doc-", ""), f);
    });

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cfg.notifyEmail)}`, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && data.success !== true) throw new Error(data.message || "Error al enviar");

      document.getElementById("wizard")?.classList.add("hidden");
      document.getElementById("exito")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (status) status.textContent = "No se pudo enviar. Escríbenos por WhatsApp con tu referencia " + refPedido;
      btn.disabled = false;
      const wa = cfg.whatsappE164?.replace(/\D/g, "");
      if (wa) {
        const t = encodeURIComponent(`Hola Boqi, envié solicitud web ref ${refPedido} pero falló el formulario.`);
        status.innerHTML += ` <a class="text-brand underline" href="https://wa.me/${wa}?text=${t}">WhatsApp</a>`;
      }
    }
  }

  btnPrev?.addEventListener("click", () => showPanel(stepIndex - 1));
  btnNext?.addEventListener("click", () => {
    if (validateStep()) showPanel(stepIndex + 1);
  });
  form?.addEventListener("submit", submitForm);

  document.addEventListener("DOMContentLoaded", () => {
    fillPlans();
    refPedido = genRef();
    showPanel(0);
    if (window.lucide) lucide.createIcons();
  });
})();
