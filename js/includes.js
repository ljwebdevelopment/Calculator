async function inject(id, path) {
  const el = document.getElementById(id);
  if (!el) return;

  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) {
    console.error("Failed to load:", path);
    return;
  }
  el.innerHTML = await res.text();
}

function applyBase(base) {
  // Convert data-href + data-src into real paths
  document.querySelectorAll("[data-href]").forEach(el => {
    el.setAttribute("href", `${base}${el.dataset.href}`);
  });
  document.querySelectorAll("[data-src]").forEach(el => {
    el.setAttribute("src", `${base}${el.dataset.src}`);
  });

  // Footer year
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

(async function () {
  // If we are in /calculators/, base must go up one folder
  const base = location.pathname.includes("/calculators/") ? "../" : "";

  // Load header/footer
  await inject("site-header", `${base}partials/header.html`);
  await inject("site-footer", `${base}partials/footer.html`);

  // Apply base paths after injection
  applyBase(base);
})();
