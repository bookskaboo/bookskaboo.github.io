(() => {
  const root = document.querySelector(".reader-shell");
  if (!root) return;

  const min = 16;
  const max = 26;
  const savedTheme = localStorage.getItem("nai-theme");
  const savedSize = Number(localStorage.getItem("nai-font-size"));
  const theme = ["light", "sepia", "dark"].includes(savedTheme) ? savedTheme : "dark";
  let fontSize = Number.isFinite(savedSize) && savedSize >= min && savedSize <= max ? savedSize : 19;

  function applyTheme(next) {
    root.dataset.theme = next;
    localStorage.setItem("nai-theme", next);
    document.querySelectorAll("[data-set-theme]").forEach((button) => {
      button.classList.toggle("active", button.dataset.setTheme === next);
      button.setAttribute("aria-pressed", String(button.dataset.setTheme === next));
    });
  }

  function applyFontSize(next) {
    fontSize = Math.max(min, Math.min(max, next));
    root.style.setProperty("--reader-size", fontSize + "px");
    localStorage.setItem("nai-font-size", String(fontSize));
    document.querySelectorAll("[data-font-size]").forEach((output) => { output.textContent = String(fontSize); });
    document.querySelectorAll("[data-font-step='-1']").forEach((button) => { button.disabled = fontSize === min; });
    document.querySelectorAll("[data-font-step='1']").forEach((button) => { button.disabled = fontSize === max; });
  }

  applyTheme(theme);
  applyFontSize(fontSize);

  document.querySelectorAll("[data-set-theme]").forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.setTheme));
  });
  document.querySelectorAll("[data-font-step]").forEach((button) => {
    button.addEventListener("click", () => applyFontSize(fontSize + Number(button.dataset.fontStep)));
  });
  document.querySelectorAll(".settings-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const controls = document.getElementById(button.getAttribute("aria-controls"));
      if (!controls) return;
      const open = controls.hidden;
      controls.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    });
  });
})();

