(function () {
  const target = window.BOQI_SOLICITAR?.secureFormUrl || "https://boqi-firmas-panel.pages.dev/#/solicitar";
  if (!window.location.href.includes("boqi-firmas-panel.pages.dev")) {
    window.setTimeout(() => {
      window.location.href = target;
    }, 1200);
  }
})();
