// ===============================================
// liste.js - Gestion de la liste espèces
// Avec Pagination + Tri + Export CSV
// ===============================================

let translations = {};
let speciesList = [];
let filteredSpecies = [];
let currentPage = 1;
let pageSize = 10;
let sortColumn = "nom";
let sortDirection = "asc";
let speciesNamesMap = {};

const swalStyles = `
  <style>
    .swal-large-modal { font-size: 16px; padding: 30px; overflow-x: hidden !important; }
    .swal-large-title { font-size: 26px !important; }
    .swal2-input, .swal2-textarea, .swal2-select { font-size: 15px !important; }
    .swal2-html-container { overflow-x: hidden !important; }
    .swal2-container { z-index: 99999 !important; }
    .swal2-backdrop-show { background: rgba(0, 0, 0, 0.6) !important; pointer-events: auto !important; }
  </style>
`;

const container = document.getElementById("especesList");

// ===== CHARGER DONNÉES =====
function loadSpeciesList() {
  speciesList = JSON.parse(localStorage.getItem("especes") || "[]");
  filteredSpecies = [...speciesList];
}

// ===== APPLIQUER FILTRES =====
function applyFiltersAndSearch() {
  const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();

  filteredSpecies = speciesList.filter(s => {
    const displayName = getDisplayName(s).toLowerCase();
    const rawName = (s.nom || "").toLowerCase();
    const matchSearch = !searchTerm || displayName.includes(searchTerm) || rawName.includes(searchTerm);
    return matchSearch;
  });

  applySorting();
  currentPage = 1;
  renderSpeciesList();
  renderPagination();
}

// ===== TRI =====
function applySorting() {
  filteredSpecies.sort((a, b) => {
    let aVal, bVal;
    
    if (sortColumn === "nom") {
      aVal = getDisplayName(a).toLowerCase();
      bVal = getDisplayName(b).toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
}

function toggleSort(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDirection = "asc";
  }
  applyFiltersAndSearch();
}

// ===== RENDU PAGINATION =====
function renderPagination() {
  const totalPages = Math.ceil(filteredSpecies.length / pageSize);
  const paginationInfo = document.getElementById("paginationInfo");
  const pageNumbers = document.getElementById("pageNumbers");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.opacity = currentPage === 1 ? "0.5" : "1";
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.style.opacity = (currentPage === totalPages || totalPages === 0) ? "0.5" : "1";
  }

  if (pageNumbers) {
    pageNumbers.innerHTML = "";
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.style.cssText = `padding:8px 12px; margin:0 2px; border-radius:4px; border:${i === currentPage ? '2px solid #1f92ac' : '1px solid #ccc'}; background:${i === currentPage ? '#1f92ac' : '#fff'}; color:${i === currentPage ? '#fff' : '#333'}; cursor:pointer; font-weight:${i === currentPage ? 'bold' : 'normal'};`;
      btn.addEventListener("click", () => {
        currentPage = i;
        renderSpeciesList();
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      pageNumbers.appendChild(btn);
    }
  }
}

// ===== UTILITAIRES =====
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getDisplayName(species) {
  return speciesNamesMap[String(species?.id)] || species?.nom || "";
}

// ===== RENDU LISTE =====
function renderSpeciesList() {
  if (!container) return;

  container.innerHTML = "";

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageSpecies = filteredSpecies.slice(start, end);

  if (!pageSpecies.length) {
    const p = document.createElement("p");
    p.style.cssText = "padding:20px; opacity:0.7; text-align:center;";
    p.textContent = translations.empty || "Aucune espèce.";
    container.appendChild(p);
    return;
  }

  pageSpecies.forEach((species) => {
    const bloc = document.createElement("div");
    bloc.classList.add("bloc");

    const h3 = document.createElement("h3");
    h3.textContent = `${species.emoji || ""} ${getDisplayName(species)}`;
    bloc.appendChild(h3);

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; justify-content:center;";

    const delBtn = document.createElement("button");
    delBtn.classList.add("del");
    delBtn.dataset.id = species.id;
    delBtn.textContent = translations.delete || "Supprimer";

    actions.appendChild(delBtn);
    bloc.appendChild(actions);
    container.appendChild(bloc);
  });
}

// ===== EXPORT CSV =====
function exportToCSV() {
  if (!filteredSpecies.length) {
    Swal.fire({ icon: "warning", title: "Aucune donnée", text: "Il n'y a rien à exporter." });
    return;
  }

  const headers = ["Espèce", "Emoji"];
  const rows = filteredSpecies.map(s => [
    getDisplayName(s),
    s.emoji || ""
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach(row => {
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
  });

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `especes_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ===== EVENTS =====
if (container) {
  container.addEventListener("click", function (e) {
    const delBtn = e.target.closest(".del");

    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      Swal.fire({
        title: translations.confirm_title || "Confirmation",
        text: "Supprimer cette espèce ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: translations.yes_delete || "Oui, supprimer",
        cancelButtonText: translations.cancel || "Annuler",
      }).then((result) => {
        if (!result.isConfirmed) return;

        speciesList = speciesList.filter(s => s.id !== id);
        localStorage.setItem("especes", JSON.stringify(speciesList));

        loadSpeciesList();
        applyFiltersAndSearch();

        Swal.fire({
          icon: "success",
          title: "Supprimée",
          text: "Espèce supprimée.",
          timer: 900,
          showConfirmButton: false,
        });
      });
      return;
    }
  });
}

// ===== LOGOUT + NAVIGATION =====
document.getElementById("logout")?.addEventListener("click", function () {
  if (typeof logoutToIndex === "function") logoutToIndex();
  else window.location.href = "../../index.html";
});

document.getElementById("add")?.addEventListener("click", function () {
  window.location.href = "add.html";
});

// ===== PAGE SIZE SELECTOR =====
document.getElementById("pageSize")?.addEventListener("change", function(e) {
  pageSize = Number(e.target.value);
  currentPage = 1;
  applyFiltersAndSearch();
});

// ===== PAGINATION BUTTONS =====
document.getElementById("prevBtn")?.addEventListener("click", function() {
  if (currentPage > 1) {
    currentPage--;
    renderSpeciesList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

document.getElementById("nextBtn")?.addEventListener("click", function() {
  const totalPages = Math.ceil(filteredSpecies.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderSpeciesList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// ===== FILTER & SEARCH EVENTS =====
document.getElementById("searchInput")?.addEventListener("input", applyFiltersAndSearch);

// ===== LANGUE =====
function languechoisie() {
  const langue = document.getElementById("langue")?.value || "fr";
  const dir = langue === "ar" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.body.setAttribute("dir", dir);
  document.body.style.direction = dir;
  localStorage.setItem("lang", langue);

  fetch("../../languages/" + langue + ".json")
    .then((res) => res.json())
    .then((data) => {
      translations = data["especes/list"] || {};
      speciesNamesMap = data["especes/names"] || {};

      setText("title", translations.title || "Espèces");

      const searchInput = document.getElementById("searchInput");
      if (searchInput && translations.search_placeholder) {
        searchInput.setAttribute("placeholder", translations.search_placeholder);
      }

      setText("exportBtn", translations.export_btn || "📥 Exporter CSV");
      setText("add", translations.add_btn || "+ Ajout");
      setText("per_page_label", translations.per_page || "Par page:");
      setText("prevBtn", translations.prev_btn || "← Précédent");
      setText("nextBtn", translations.next_btn || "Suivant →");

      // Traductions des boutons de tri
      const sortButtons = document.querySelectorAll("[onclick^='toggleSort']");
      sortButtons.forEach(btn => {
        const match = btn.getAttribute("onclick").match(/toggleSort\('([^']+)'\)/);
        if (match) {
          const column = match[1];
          const key = `sort_${column}`;
          btn.textContent = translations[key] || btn.textContent;
        }
      });

      const c = data.common || {};
      setText("titre", c.titre || "Pet Manager");
      setText("subtitle", c.subtitle || "");
      
      // Navigation
      document.getElementById("dashboard")?.querySelector("span") && (document.getElementById("dashboard").querySelector("span").innerText = c.dashboard || "Dashboard");
      document.getElementById("animaux")?.querySelector("span") && (document.getElementById("animaux").querySelector("span").innerText = c.animaux || "Animaux");
      document.getElementById("nourriture")?.querySelector("span") && (document.getElementById("nourriture").querySelector("span").innerText = c.nourriture || "Nourriture");
      document.getElementById("vaccinations")?.querySelector("span") && (document.getElementById("vaccinations").querySelector("span").innerText = c.vaccinations || "Vaccinations");
      document.getElementById("RDV")?.querySelector("span") && (document.getElementById("RDV").querySelector("span").innerText = c.RDV || "Rendez-vous");
      document.getElementById("espece")?.querySelector("span") && (document.getElementById("espece").querySelector("span").innerText = c.espece || "Espèces");
      setText("logout", c.logout || "Déconnexion");
      
      const session = JSON.parse(localStorage.getItem("sessionUser") || "null");
      if (session && session.email) {
        const userName = session.email.split('@')[0];
        setText("nom", userName.charAt(0).toUpperCase() + userName.slice(1));
      }
      
      document.body.style.visibility = "visible";

      loadSpeciesList();
      applyFiltersAndSearch();
    })
    .catch(() => {
      document.documentElement.setAttribute("dir", dir);
      document.body.setAttribute("dir", dir);
      document.body.style.direction = dir;
      document.body.style.visibility = "visible";
      loadSpeciesList();
      applyFiltersAndSearch();
    });
}

document.getElementById("langue")?.addEventListener("change", languechoisie);

const saved = localStorage.getItem("lang") || "fr";
const langSelect = document.getElementById("langue");
if (langSelect) langSelect.value = saved;

// ===== INIT =====
loadSpeciesList();
languechoisie();
