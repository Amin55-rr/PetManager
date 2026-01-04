// ===============================================
// listv.js - Gestion de la liste vaccinations
// Avec Pagination + Filtres + Tri + Export CSV
// ===============================================

let translations = {};
let vaccList = [];
let filteredVacc = [];
let currentPage = 1;
let pageSize = 10;
let sortColumn = "date";
let sortDirection = "desc";

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

const container = document.getElementById("animalsList");

// ===== CHARGER DONNÉES =====
function loadVaccList() {
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  vaccList = Array.isArray(db.vaccinations) ? db.vaccinations : [];
  filteredVacc = [...vaccList];
}

// ===== APPLIQUER FILTRES =====
function applyFiltersAndSearch() {
  const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const animalFilter = document.getElementById("filterAnimal")?.value || "";
  const vaccineFilter = document.getElementById("filterVaccine")?.value || "";

  filteredVacc = vaccList.filter(v => {
    const matchSearch = !searchTerm || (v.animalName || "").toLowerCase().includes(searchTerm);
    const matchAnimal = !animalFilter || v.animalId === Number(animalFilter);
    const matchVaccine = !vaccineFilter || (v.vaccine || "").includes(vaccineFilter);
    return matchSearch && matchAnimal && matchVaccine;
  });

  applySorting();
  currentPage = 1;
  renderVaccList();
  renderPagination();
}

// ===== TRI =====
function applySorting() {
  filteredVacc.sort((a, b) => {
    let aVal, bVal;
    
    if (sortColumn === "date") {
      aVal = new Date(a.date || 0).getTime();
      bVal = new Date(b.date || 0).getTime();
    } else if (sortColumn === "animalName") {
      aVal = (a.animalName || "").toLowerCase();
      bVal = (b.animalName || "").toLowerCase();
    } else if (sortColumn === "vaccine") {
      aVal = (a.vaccine || "").toLowerCase();
      bVal = (b.vaccine || "").toLowerCase();
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
  const totalPages = Math.ceil(filteredVacc.length / pageSize);
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
        renderVaccList();
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      pageNumbers.appendChild(btn);
    }
  }
}

// ===== REMPLIR FILTRE ANIMAUX =====
function populateAnimalFilter() {
  const select = document.getElementById("filterAnimal");
  if (!select) return;

  const animals = JSON.parse(localStorage.getItem("animaux") || "[]");
  select.innerHTML = `<option value="">${escapeHtml(translations.filter_animal || "Tous les animaux")}</option>`;
  
  animals.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = `${a.espece_emoji || ""} ${a.nom || ""}`;
    select.appendChild(opt);
  });
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

async function editVaccModal(id) {
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  const target = (db.vaccinations || []).find(v => Number(v.id) === Number(id));
  if (!target) return;

  const animals = JSON.parse(localStorage.getItem("animaux") || "[]");
  const animalOptions = animals.map(a => {
    const label = `${a.espece_emoji || ""} ${a.nom || ""}`.trim();
    const selected = Number(a.id) === Number(target.animalId) || (!target.animalId && target.animalName === a.nom) ? "selected" : "";
    return `<option value="${a.id}" ${selected}>${escapeHtml(label)}</option>`;
  }).join("");

  const { value: form } = await Swal.fire({
    title: translations.edit_title || "Modifier vaccination",
    width: "750px",
    customClass: { popup: "swal-large-modal", title: "swal-large-title" },
    html: `${swalStyles}
      <div style="text-align:left; display:grid; gap:18px; padding:10px;">
        <div>
          <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.animal || "Animal")}</label>
          <select id="swalAnimal" class="swal2-select" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;">
            <option value="">${escapeHtml(translations.choose || "Sélectionner")}</option>
            ${animalOptions}
          </select>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.vaccine || "Vaccin")}</label>
            <input id="swalVaccine" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.vaccine || "")}" />
          </div>
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.vet || "Vétérinaire")}</label>
            <input id="swalVet" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.vet || "")}" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.date || "Date")}</label>
            <input id="swalDate" type="date" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.date || "")}" />
          </div>
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.next_date || "Prochaine dose")}</label>
            <input id="swalNextDate" type="date" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.nextDate || "")}" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.price || "Prix")}</label>
            <input id="swalPrice" type="number" min="0" step="0.01" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.priceEur ?? "")}" />
          </div>
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.notes || "Notes")}</label>
            <textarea id="swalNotes" class="swal2-textarea" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px; min-height:80px;">${escapeHtml(target.notes || "")}</textarea>
          </div>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: translations.save || "Enregistrer",
    cancelButtonText: translations.cancel || "Annuler",
    confirmButtonColor: "#1f92ac",
    preConfirm: () => {
      const animalId = Number(document.getElementById("swalAnimal")?.value || 0) || null;
      const vaccine = document.getElementById("swalVaccine")?.value.trim() || "";
      const vet = document.getElementById("swalVet")?.value.trim() || "";
      const date = document.getElementById("swalDate")?.value || "";
      const nextDate = document.getElementById("swalNextDate")?.value || "";
      const price = Number(document.getElementById("swalPrice")?.value);
      const notes = document.getElementById("swalNotes")?.value.trim() || "";

      if (!vaccine) {
        Swal.showValidationMessage(translations.vaccine_required || "Vaccin obligatoire");
        return false;
      }
      if (!date) {
        Swal.showValidationMessage(translations.date_required || "Date obligatoire");
        return false;
      }

      return { animalId, vaccine, vet, date, nextDate, price, notes };
    },
    allowOutsideClick: () => !Swal.isLoading()
  });

  if (!form) return;

  const selectedAnimal = animals.find(a => Number(a.id) === Number(form.animalId));
  const updated = {
    ...target,
    animalId: form.animalId,
    animalName: selectedAnimal ? selectedAnimal.nom : target.animalName,
    vaccine: form.vaccine,
    vet: form.vet,
    date: form.date,
    nextDate: form.nextDate,
    priceEur: isNaN(form.price) ? target.priceEur : form.price,
    notes: form.notes,
    updatedAt: new Date().toISOString()
  };

  db.vaccinations = (db.vaccinations || []).map(v => Number(v.id) === Number(id) ? updated : v);
  localStorage.setItem("db", JSON.stringify(db));

  loadVaccList();
  applyFiltersAndSearch();

  Swal.fire({
    icon: "success",
    title: translations.updated || "Mise à jour",
    text: translations.update_success || "Vaccination mise à jour.",
    timer: 1200,
    showConfirmButton: false
  });
}

// ===== RENDU LISTE =====
function renderVaccList() {
  if (!container) return;

  container.innerHTML = "";

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageVacc = filteredVacc.slice(start, end);

  if (!pageVacc.length) {
    const p = document.createElement("p");
    p.style.cssText = "padding:20px; opacity:0.7; text-align:center;";
    p.textContent = translations.empty || "Aucune vaccination.";
    container.appendChild(p);
    return;
  }

  pageVacc.forEach((vacc) => {
    const bloc = document.createElement("div");
    bloc.classList.add("bloc");

    const h3 = document.createElement("h3");
    h3.textContent = `💉 ${vacc.vaccine || ""}`;
    bloc.appendChild(h3);

    const addRow = (label, value) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(" " + (value ?? "-")));
      return p;
    };

    bloc.appendChild(addRow(translations.animal || "Animal :", vacc.animalName || "-"));
    bloc.appendChild(addRow(translations.vaccine || "Vaccin :", vacc.vaccine || "-"));
    bloc.appendChild(addRow(translations.vet || "Vétérinaire :", vacc.vet || "-"));
    bloc.appendChild(addRow(translations.date || "Date :", vacc.date || "-"));
    bloc.appendChild(addRow(translations.price || "Prix :", vacc.priceEur ? vacc.priceEur + " MAD" : "-"));

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;";

    const detailsBtn = document.createElement("button");
    detailsBtn.classList.add("details");
    detailsBtn.dataset.id = vacc.id;
    detailsBtn.textContent = translations.details || "Voir détails";
    detailsBtn.style.cssText = "padding:8px 12px; background:#17a2b8; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;";

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit");
    editBtn.dataset.id = vacc.id;
    editBtn.textContent = translations.edit || "Modifier";

    const delBtn = document.createElement("button");
    delBtn.classList.add("del");
    delBtn.dataset.id = vacc.id;
    delBtn.textContent = translations.delete || "Supprimer";

    actions.appendChild(detailsBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    bloc.appendChild(actions);
    container.appendChild(bloc);
  });
}

// ===== EXPORT CSV =====
function exportToCSV() {
  if (!filteredVacc.length) {
    Swal.fire({ icon: "warning", title: "Aucune donnée", text: "Il n'y a rien à exporter." });
    return;
  }

  const headers = ["Animal", "Vaccin", "Vétérinaire", "Date"];
  const rows = filteredVacc.map(v => [
    v.animalName || "",
    v.vaccineName || "",
    v.vet || "",
    v.date || ""
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach(row => {
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `vaccinations_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ===== EXPORT FICHE PDF =====
function exportVaccToPDF(vacc) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(31, 146, 172);
  doc.text("FICHE VACCINATION", 105, 20, { align: "center" });

  doc.setDrawColor(31, 146, 172);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  let y = 40;

  doc.setFont(undefined, 'bold');
  doc.text("Animal:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(vacc.animalName || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Vaccin:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(vacc.vaccine || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Veterinaire:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(vacc.vet || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Date:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(vacc.date || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Prochaine dose:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(vacc.nextDate || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Prix:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(vacc.priceEur ? vacc.priceEur + " MAD" : "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Notes:", 20, y);
  doc.setFont(undefined, 'normal');
  const notes = vacc.notes || "Aucune note";
  const splitNotes = doc.splitTextToSize(notes, 130);
  doc.text(splitNotes, 60, y);

  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("Pet Manager - " + new Date().toLocaleDateString(), 105, 280, { align: "center" });

  doc.save(`Vaccination_${vacc.animalName}_${vacc.id}.pdf`);
}

// ===== EVENTS =====
if (container) {
  container.addEventListener("click", function (e) {
    const detailsBtn = e.target.closest(".details");
    const editBtn = e.target.closest(".edit");
    const delBtn = e.target.closest(".del");

    if (detailsBtn) {
      const id = Number(detailsBtn.dataset.id);
      const vacc = filteredVacc.find(v => v.id === id);
      if (!vacc) return;

      Swal.fire({
        title: `💉 ${vacc.vaccine || "Vaccination"}`,
        width: '650px',
        html: `
          <div style="text-align:left; padding:20px; display:grid; gap:15px;">
            <p><strong>Animal:</strong> ${vacc.animalName || "-"}</p>
            <p><strong>Vaccin:</strong> ${vacc.vaccine || "-"}</p>
            <p><strong>Vétérinaire:</strong> ${vacc.vet || "-"}</p>
            <p><strong>Date:</strong> ${vacc.date || "-"}</p>
            <p><strong>Prochaine dose:</strong> ${vacc.nextDate || "-"}</p>
            <p><strong>Prix:</strong> ${vacc.priceEur ? vacc.priceEur + " MAD" : "-"}</p>
            <p><strong>Notes:</strong> ${vacc.notes || "-"}</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '📥 Export PDF',
        cancelButtonText: 'Fermer',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        showCloseButton: true
      }).then((result) => {
        if (result.isConfirmed) {
          exportVaccToPDF(vacc);
        }
      });
      return;
    }

    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      editVaccModal(id);
      return;
    }

    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      Swal.fire({
        title: translations.confirm_title || "Confirmation",
        text: "Supprimer cette vaccination ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: translations.yes_delete || "Oui, supprimer",
        cancelButtonText: translations.cancel || "Annuler",
      }).then((result) => {
        if (!result.isConfirmed) return;

        const db = JSON.parse(localStorage.getItem("db") || "{}");
        db.vaccinations = (db.vaccinations || []).filter(v => v.id !== id);
        localStorage.setItem("db", JSON.stringify(db));

        loadVaccList();
        applyFiltersAndSearch();

        Swal.fire({
          icon: "success",
          title: "Supprimée",
          text: "Vaccination supprimée.",
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
    renderVaccList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

document.getElementById("nextBtn")?.addEventListener("click", function() {
  const totalPages = Math.ceil(filteredVacc.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderVaccList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// ===== FILTER & SEARCH EVENTS =====
document.getElementById("searchInput")?.addEventListener("input", applyFiltersAndSearch);
document.getElementById("filterAnimal")?.addEventListener("change", applyFiltersAndSearch);
document.getElementById("filterVaccine")?.addEventListener("change", applyFiltersAndSearch);

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
      translations = data["vaccinations/list"] || {};

      setText("title", translations.title || "Vaccinations");

      const c = data.common || {};
      setText("titre", c.titre || "Pet Manager");
      setText("subtitle", c.subtitle || "");

      const navItems = {
        "dashboard": c.dashboard || "Dashboard",
        "animaux": c.animaux || "Animaux",
        "nourriture": c.nourriture || "Nourriture",
        "vaccinations": c.vaccinations || "Vaccinations",
        "RDV": c.RDV || "Rendez-vous",
        "espece": c.espece || "Espèces",
        "logout": c.logout || "Déconnexion"
      };

      document.querySelectorAll("nav a[id]").forEach(el => {
        const key = el.id;
        if (navItems[key]) {
          const span = el.querySelector("span");
          if (span) span.textContent = navItems[key];
        }
      });
      const logoutBtn = document.getElementById("logout");
      if (logoutBtn) logoutBtn.textContent = navItems.logout;

      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.placeholder = translations.search_placeholder || "🔍 Rechercher par animal...";

      const filterAnimalOption = document.querySelector("#filterAnimal option[value='']");
      if (filterAnimalOption) filterAnimalOption.textContent = translations.filter_animal || "Tous les animaux";

      const filterVaccineOption = document.querySelector("#filterVaccine option[value='']");
      if (filterVaccineOption) filterVaccineOption.textContent = translations.filter_vaccine || "Tous les vaccins";

      const addBtn = document.getElementById("add");
      if (addBtn) addBtn.textContent = translations.add_btn || "+ Ajout";

      const exportBtn = document.getElementById("exportBtn");
      if (exportBtn) exportBtn.textContent = translations.export_btn || "📥 Exporter CSV";

      const perPageLabel = document.querySelector("label span");
      if (perPageLabel) perPageLabel.textContent = translations.per_page || "Par page:";

      const prevBtn = document.getElementById("prevBtn");
      if (prevBtn) prevBtn.textContent = translations.prev_btn || "← Précédent";

      const nextBtn = document.getElementById("nextBtn");
      if (nextBtn) nextBtn.textContent = translations.next_btn || "Suivant →";

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

      const session = JSON.parse(localStorage.getItem("sessionUser") || "null");
      if (session && session.email) {
        const userName = session.email.split('@')[0];
        setText("nom", userName.charAt(0).toUpperCase() + userName.slice(1));
      }
      document.body.style.visibility = "visible";

      loadVaccList();
      populateAnimalFilter();
      applyFiltersAndSearch();
    })
    .catch(() => {
      document.documentElement.setAttribute("dir", dir);
      document.body.setAttribute("dir", dir);
      document.body.style.direction = dir;
      document.body.style.visibility = "visible";
      loadVaccList();
      populateAnimalFilter();
      applyFiltersAndSearch();
    });
}

document.getElementById("langue")?.addEventListener("change", languechoisie);

const saved = localStorage.getItem("lang") || "fr";
const langSelect = document.getElementById("langue");
if (langSelect) langSelect.value = saved;

// ===== INIT =====
loadVaccList();
populateAnimalFilter();
languechoisie();
