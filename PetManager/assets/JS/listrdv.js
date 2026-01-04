// ===============================================
// listrdv.js - Gestion de la liste RDV
// Avec Pagination + Filtres + Tri + Export CSV
// ===============================================

let translations = {};
let rdvList = [];
let filteredRdv = [];
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
function loadRdvList() {
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  rdvList = Array.isArray(db.appointments) ? db.appointments : [];
  filteredRdv = [...rdvList];
}

// ===== APPLIQUER FILTRES =====
function applyFiltersAndSearch() {
  const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const animalFilter = document.getElementById("filterAnimal")?.value || "";
  const reasonFilter = document.getElementById("filterReason")?.value || "";

  filteredRdv = rdvList.filter(r => {
    const matchSearch = !searchTerm || (r.animalName || "").toLowerCase().includes(searchTerm);
    const matchAnimal = !animalFilter || r.animalId === Number(animalFilter);
    const matchReason = !reasonFilter || (r.reason || "").includes(reasonFilter);
    return matchSearch && matchAnimal && matchReason;
  });

  applySorting();
  currentPage = 1;
  renderRdvList();
  renderPagination();
}

// ===== TRI =====
function applySorting() {
  filteredRdv.sort((a, b) => {
    let aVal, bVal;
    
    if (sortColumn === "date") {
      aVal = new Date(a.date || 0).getTime();
      bVal = new Date(b.date || 0).getTime();
    } else if (sortColumn === "animalName") {
      aVal = (a.animalName || "").toLowerCase();
      bVal = (b.animalName || "").toLowerCase();
    } else if (sortColumn === "reason") {
      aVal = (a.reason || "").toLowerCase();
      bVal = (b.reason || "").toLowerCase();
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
  const totalPages = Math.ceil(filteredRdv.length / pageSize);
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
        renderRdvList();
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

async function editRdvModal(id) {
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  const target = (db.appointments || []).find(r => Number(r.id) === Number(id));
  if (!target) return;

  const animals = JSON.parse(localStorage.getItem("animaux") || "[]");
  const animalOptions = animals.map(a => {
    const label = `${a.espece_emoji || ""} ${a.nom || ""}`.trim();
    const selected = Number(a.id) === Number(target.animalId) || (!target.animalId && target.animalName === a.nom) ? "selected" : "";
    return `<option value="${a.id}" ${selected}>${escapeHtml(label)}</option>`;
  }).join("");

  const { value: form } = await Swal.fire({
    title: translations.edit_title || "Modifier rendez-vous",
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
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.date || "Date")}</label>
            <input id="swalDate" type="date" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.date || "")}" />
          </div>
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.time || "Heure")}</label>
            <input id="swalTime" type="time" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.time || "")}" />
          </div>
        </div>

        <div>
          <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.reason || "Raison")}</label>
          <textarea id="swalReason" class="swal2-textarea" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px; min-height:80px;">${escapeHtml(target.reason || "")}</textarea>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.vet || "Vétérinaire")}</label>
            <input id="swalVet" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.vet || "")}" />
          </div>
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.price || "Prix")}</label>
            <input id="swalPrice" type="number" min="0" step="0.01" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.priceEur ?? "")}" />
          </div>
        </div>

        <div>
          <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.notes || "Notes")}</label>
          <textarea id="swalNotes" class="swal2-textarea" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px; min-height:80px;">${escapeHtml(target.notes || "")}</textarea>
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
      const date = document.getElementById("swalDate")?.value || "";
      const time = document.getElementById("swalTime")?.value || "";
      const reason = document.getElementById("swalReason")?.value.trim() || "";
      const vet = document.getElementById("swalVet")?.value.trim() || "";
      const price = Number(document.getElementById("swalPrice")?.value);
      const notes = document.getElementById("swalNotes")?.value.trim() || "";

      if (!date) {
        Swal.showValidationMessage(translations.date_required || "Date obligatoire");
        return false;
      }
      if (!reason) {
        Swal.showValidationMessage(translations.reason_required || "Raison obligatoire");
        return false;
      }

      return { animalId, date, time, reason, vet, price, notes };
    },
    allowOutsideClick: () => !Swal.isLoading()
  });

  if (!form) return;

  const selectedAnimal = animals.find(a => Number(a.id) === Number(form.animalId));
  const updated = {
    ...target,
    animalId: form.animalId,
    animalName: selectedAnimal ? selectedAnimal.nom : target.animalName,
    date: form.date,
    time: form.time,
    reason: form.reason,
    vet: form.vet,
    priceEur: isNaN(form.price) ? target.priceEur : form.price,
    notes: form.notes,
    updatedAt: new Date().toISOString()
  };

  db.appointments = (db.appointments || []).map(r => Number(r.id) === Number(id) ? updated : r);
  localStorage.setItem("db", JSON.stringify(db));

  loadRdvList();
  applyFiltersAndSearch();

  Swal.fire({
    icon: "success",
    title: translations.updated || "Mise à jour",
    text: translations.update_success || "Rendez-vous mis à jour.",
    timer: 1200,
    showConfirmButton: false
  });
}

// ===== RENDU LISTE =====
function renderRdvList() {
  if (!container) return;

  container.innerHTML = "";

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageRdv = filteredRdv.slice(start, end);

  if (!pageRdv.length) {
    const p = document.createElement("p");
    p.style.cssText = "padding:20px; opacity:0.7; text-align:center;";
    p.textContent = translations.empty || "Aucun rendez-vous.";
    container.appendChild(p);
    return;
  }

  pageRdv.forEach((rdv) => {
    const bloc = document.createElement("div");
    bloc.classList.add("bloc");

    const h3 = document.createElement("h3");
    h3.textContent = `📅 ${rdv.date || ""}`;
    bloc.appendChild(h3);

    const addRow = (label, value) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(" " + (value ?? "-")));
      return p;
    };

    bloc.appendChild(addRow(translations.animal || "Animal :", rdv.animalName || "-"));
    bloc.appendChild(addRow(translations.date || "Date :", rdv.date || "-"));
    bloc.appendChild(addRow(translations.time || "Heure :", rdv.time || "-"));
    bloc.appendChild(addRow(translations.reason || "Raison :", rdv.reason || "-"));
    bloc.appendChild(addRow(translations.vet || "Vétérinaire :", rdv.vet || "-"));
    bloc.appendChild(addRow(translations.price || "Prix :", rdv.priceEur ? rdv.priceEur + " MAD" : "-"));

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;";

    const detailsBtn = document.createElement("button");
    detailsBtn.classList.add("details");
    detailsBtn.dataset.id = rdv.id;
    detailsBtn.textContent = translations.details || "Voir détails";
    detailsBtn.style.cssText = "padding:8px 12px; background:#17a2b8; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;";

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit");
    editBtn.dataset.id = rdv.id;
    editBtn.textContent = translations.edit || "Modifier";

    const delBtn = document.createElement("button");
    delBtn.classList.add("del");
    delBtn.dataset.id = rdv.id;
    delBtn.textContent = translations.delete || "Supprimer";

    actions.appendChild(detailsBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    bloc.appendChild(actions);
    container.appendChild(bloc);
  });
}

// ===== EXPORT PDF =====
function exportRdvToPDF(rdv) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("FICHE RENDEZ-VOUS", 105, 20, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  let y = 40;
  doc.setFontSize(12);
  
  // Animal
  doc.setFont("helvetica", "bold");
  doc.text("Animal:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(rdv.animalName || "-", 70, y);
  y += 10;
  
  // Date
  doc.setFont("helvetica", "bold");
  doc.text("Date:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(rdv.date || "-", 70, y);
  y += 10;
  
  // Time
  doc.setFont("helvetica", "bold");
  doc.text("Heure:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(rdv.time || "-", 70, y);
  y += 10;
  
  // Reason
  doc.setFont("helvetica", "bold");
  doc.text("Raison:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(rdv.reason || "-", 70, y);
  y += 10;
  
  // Veterinarian
  doc.setFont("helvetica", "bold");
  doc.text("Vétérinaire:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(rdv.vet || "-", 70, y);
  y += 10;
  
  // Price
  doc.setFont("helvetica", "bold");
  doc.text("Prix:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${rdv.priceEur || "0"} MAD`, 70, y);
  y += 10;
  
  // Notes
  doc.setFont("helvetica", "bold");
  doc.text("Notes:", 20, y);
  doc.setFont("helvetica", "normal");
  const notesText = rdv.notes || "-";
  const splitNotes = doc.splitTextToSize(notesText, 120);
  doc.text(splitNotes, 70, y);
  
  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, 280, { align: "center" });
  
  // Save
  doc.save(`RDV_${rdv.animalName}_${rdv.id}.pdf`);
}

// ===== EXPORT CSV =====
function exportToCSV() {
  if (!filteredRdv.length) {
    Swal.fire({ icon: "warning", title: "Aucune donnée", text: "Il n'y a rien à exporter." });
    return;
  }

  const headers = ["Animal", "Date", "Raison"];
  const rows = filteredRdv.map(r => [
    r.animalName || "",
    r.date || "",
    r.reason || ""
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach(row => {
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `rdv_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ===== EVENTS =====
if (container) {
  container.addEventListener("click", function (e) {
    const detailsBtn = e.target.closest(".details");
    const editBtn = e.target.closest(".edit");
    const delBtn = e.target.closest(".del");

    if (detailsBtn) {
      const id = Number(detailsBtn.dataset.id);
      const rdv = filteredRdv.find(r => r.id === id);
      if (!rdv) return;

      Swal.fire({
        title: `📅 ${rdv.date}`,
        width: '600px',
        html: `
          <div style="text-align:left; padding:20px; display:grid; gap:15px;">
            <p><strong>Animal:</strong> ${rdv.animalName || "-"}</p>
            <p><strong>Date:</strong> ${rdv.date || "-"}</p>
            <p><strong>Heure:</strong> ${rdv.time || "-"}</p>
            <p><strong>Raison:</strong> ${rdv.reason || "-"}</p>
            <p><strong>Vétérinaire:</strong> ${rdv.vet || "-"}</p>
            <p><strong>Prix:</strong> ${rdv.priceEur || "0"} MAD</p>
            <p><strong>Notes:</strong> ${rdv.notes || "-"}</p>
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
          exportRdvToPDF(rdv);
        }
      });
      return;
    }

    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      editRdvModal(id);
      return;
    }

    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      Swal.fire({
        title: translations.confirm_title || "Confirmation",
        text: "Supprimer ce rendez-vous ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: translations.yes_delete || "Oui, supprimer",
        cancelButtonText: translations.cancel || "Annuler",
      }).then((result) => {
        if (!result.isConfirmed) return;

        const db = JSON.parse(localStorage.getItem("db") || "{}");
        db.appointments = (db.appointments || []).filter(r => r.id !== id);
        localStorage.setItem("db", JSON.stringify(db));

        loadRdvList();
        applyFiltersAndSearch();

        Swal.fire({
          icon: "success",
          title: "Supprimé",
          text: "Rendez-vous supprimé.",
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
    renderRdvList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

document.getElementById("nextBtn")?.addEventListener("click", function() {
  const totalPages = Math.ceil(filteredRdv.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderRdvList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// ===== FILTER & SEARCH EVENTS =====
document.getElementById("searchInput")?.addEventListener("input", applyFiltersAndSearch);
document.getElementById("filterAnimal")?.addEventListener("change", applyFiltersAndSearch);
document.getElementById("filterReason")?.addEventListener("change", applyFiltersAndSearch);

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
      translations = data["RDV/list"] || {};

      setText("title", translations.title || "Rendez-vous");

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

      const filterReasonOption = document.querySelector("#filterReason option[value='']");
      if (filterReasonOption) filterReasonOption.textContent = translations.filter_reason || "Toutes les raisons";

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

      loadRdvList();
      populateAnimalFilter();
      applyFiltersAndSearch();
    })
    .catch(() => {
      document.documentElement.setAttribute("dir", dir);
      document.body.setAttribute("dir", dir);
      document.body.style.direction = dir;
      document.body.style.visibility = "visible";
      loadRdvList();
      populateAnimalFilter();
      applyFiltersAndSearch();
    });
}

document.getElementById("langue")?.addEventListener("change", languechoisie);

const saved = localStorage.getItem("lang") || "fr";
const langSelect = document.getElementById("langue");
if (langSelect) langSelect.value = saved;

// ===== INIT =====
loadRdvList();
populateAnimalFilter();
languechoisie();
