// ===============================================
// listn.js - Gestion de la liste nourriture
// Avec Pagination + Filtres + Tri + Export CSV
// ===============================================

let translations = {};
let foodList = [];
let filteredFood = [];
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
function loadFoodList() {
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  foodList = Array.isArray(db.foodPurchases) ? db.foodPurchases : [];
  filteredFood = [...foodList];
}

// ===== APPLIQUER FILTRES =====
function applyFiltersAndSearch() {
  const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const animalFilter = document.getElementById("filterAnimal")?.value || "";
  const typeFilter = document.getElementById("filterType")?.value || "";

  filteredFood = foodList.filter(f => {
    const matchSearch = !searchTerm || (f.animalName || "").toLowerCase().includes(searchTerm);
    const matchAnimal = !animalFilter || f.animalId === Number(animalFilter);
    const matchType = !typeFilter || (f.foodType || "").includes(typeFilter);
    return matchSearch && matchAnimal && matchType;
  });

  applySorting();
  currentPage = 1;
  renderFoodList();
  renderPagination();
}

// ===== TRI =====
function applySorting() {
  filteredFood.sort((a, b) => {
    let aVal, bVal;
    
    if (sortColumn === "date") {
      aVal = new Date(a.purchaseDate || 0).getTime();
      bVal = new Date(b.purchaseDate || 0).getTime();
    } else if (sortColumn === "animalName") {
      aVal = (a.animalName || "").toLowerCase();
      bVal = (b.animalName || "").toLowerCase();
    } else if (sortColumn === "type") {
      aVal = (a.foodType || "").toLowerCase();
      bVal = (b.foodType || "").toLowerCase();
    } else if (sortColumn === "brand") {
      aVal = (a.brand || "").toLowerCase();
      bVal = (b.brand || "").toLowerCase();
    } else if (sortColumn === "price") {
      aVal = a.priceEur || 0;
      bVal = b.priceEur || 0;
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
  const totalPages = Math.ceil(filteredFood.length / pageSize);
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
        renderFoodList();
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

async function editFoodModal(id) {
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  const target = (db.foodPurchases || []).find(f => Number(f.id) === Number(id));
  if (!target) return;

  const animals = JSON.parse(localStorage.getItem("animaux") || "[]");
  const animalOptions = animals.map(a => {
    const label = `${a.espece_emoji || ""} ${a.nom || ""}`.trim();
    const selected = Number(a.id) === Number(target.animalId) ? "selected" : "";
    return `<option value="${a.id}" ${selected}>${escapeHtml(label)}</option>`;
  }).join("");

  const { value: form } = await Swal.fire({
    title: translations.edit_title || "Modifier achat",
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
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.type || "Type")}</label>
            <select id="swalType" class="swal2-select" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;">
              <option value="">${escapeHtml(translations.choose || "Sélectionner")}</option>
              <option value="Croquettes" ${target.foodType === "Croquettes" ? "selected" : ""}>Croquettes</option>
              <option value="Pâtée" ${target.foodType === "Pâtée" ? "selected" : ""}>Pâtée</option>
              <option value="Friandises" ${target.foodType === "Friandises" ? "selected" : ""}>Friandises</option>
              <option value="${escapeHtml(target.foodType || "Autre")}" ${target.foodType && !["Croquettes","Pâtée","Friandises"].includes(target.foodType) ? "selected" : ""}>${escapeHtml(target.foodType || "Autre")}</option>
            </select>
          </div>
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.brand || "Marque")}</label>
            <input id="swalBrand" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.brand || "")}" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.quantity || "Quantité (kg)")}</label>
            <input id="swalQty" type="number" min="0" step="0.1" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.quantityKg ?? "")}" />
          </div>
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.price || "Prix")}</label>
            <input id="swalPrice" type="number" min="0" step="0.01" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.priceEur ?? "")}" />
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.date || "Date")}</label>
            <input id="swalDate" type="date" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(target.purchaseDate || "")}" />
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
      const foodType = document.getElementById("swalType")?.value.trim() || "";
      const brand = document.getElementById("swalBrand")?.value.trim() || "";
      const quantity = Number(document.getElementById("swalQty")?.value);
      const price = Number(document.getElementById("swalPrice")?.value);
      const date = document.getElementById("swalDate")?.value || "";
      const notes = document.getElementById("swalNotes")?.value.trim() || "";

      if (!brand) {
        Swal.showValidationMessage(translations.brand_required || "Marque obligatoire");
        return false;
      }
      if (!date) {
        Swal.showValidationMessage(translations.date_required || "Date obligatoire");
        return false;
      }

      return { animalId, foodType, brand, quantity, price, date, notes };
    },
    allowOutsideClick: () => !Swal.isLoading()
  });

  if (!form) return;

  const selectedAnimal = animals.find(a => Number(a.id) === Number(form.animalId));
  const updated = {
    ...target,
    animalId: form.animalId,
    animalName: selectedAnimal ? selectedAnimal.nom : target.animalName,
    animalSpecies: selectedAnimal ? selectedAnimal.espece_nom || selectedAnimal.species || target.animalSpecies : target.animalSpecies,
    foodType: form.foodType,
    brand: form.brand,
    quantityKg: isNaN(form.quantity) ? target.quantityKg : form.quantity,
    priceEur: isNaN(form.price) ? target.priceEur : form.price,
    purchaseDate: form.date,
    notes: form.notes,
    updatedAt: new Date().toISOString()
  };

  db.foodPurchases = (db.foodPurchases || []).map(f => Number(f.id) === Number(id) ? updated : f);
  localStorage.setItem("db", JSON.stringify(db));

  loadFoodList();
  applyFiltersAndSearch();

  Swal.fire({
    icon: "success",
    title: translations.updated || "Mise à jour",
    text: translations.update_success || "Achat mis à jour avec succès.",
    timer: 1200,
    showConfirmButton: false
  });
}

// ===== RENDU LISTE =====
function renderFoodList() {
  if (!container) return;

  container.innerHTML = "";

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageFood = filteredFood.slice(start, end);

  if (!pageFood.length) {
    const p = document.createElement("p");
    p.style.cssText = "padding:20px; opacity:0.7; text-align:center;";
    p.textContent = translations.empty || "Aucun achat de nourriture.";
    container.appendChild(p);
    return;
  }

  pageFood.forEach((food) => {
    const bloc = document.createElement("div");
    bloc.classList.add("bloc");

    const h3 = document.createElement("h3");
    h3.textContent = `🍖 ${food.brand || ""}`;
    bloc.appendChild(h3);

    const addRow = (label, value) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(" " + (value ?? "-")));
      return p;
    };

    bloc.appendChild(addRow(translations.animal || "Animal :", food.animalName || "-"));
    bloc.appendChild(addRow(translations.type || "Type :", food.foodType || "-"));
    bloc.appendChild(addRow(translations.quantity || "Quantité :", food.quantityKg ? food.quantityKg + " kg" : "-"));
    bloc.appendChild(addRow(translations.price || "Prix :", food.priceEur ? food.priceEur + " MAD" : "-"));
    bloc.appendChild(addRow(translations.date || "Date :", food.purchaseDate || "-"));

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;";

    const detailsBtn = document.createElement("button");
    detailsBtn.classList.add("details");
    detailsBtn.dataset.id = food.id;
    detailsBtn.textContent = translations.details || "Voir détails";
    detailsBtn.style.cssText = "padding:8px 12px; background:#17a2b8; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;";

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit");
    editBtn.dataset.id = food.id;
    editBtn.textContent = translations.edit || "Modifier";

    const delBtn = document.createElement("button");
    delBtn.classList.add("del");
    delBtn.dataset.id = food.id;
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
  if (!filteredFood.length) {
    Swal.fire({ icon: "warning", title: "Aucune donnée", text: "Il n'y a rien à exporter." });
    return;
  }

  const headers = ["Animal", "Type", "Marque", "Quantité (kg)", "Prix (€)", "Date"];
  const rows = filteredFood.map(f => [
    f.animalName || "",
    f.type || "",
    f.brand || "",
    f.quantity ?? "",
    f.price ?? "",
    f.date || ""
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach(row => {
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `nourriture_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ===== EXPORT FICHE PDF =====
function exportFoodToPDF(food) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Récupérer le nom de l'espèce
  const animaux = JSON.parse(localStorage.getItem("animaux") || "[]");
  const especes = JSON.parse(localStorage.getItem("especes") || "[]");
  const animal = animaux.find(a => a.id === food.animalId);
  const espece = animal ? especes.find(e => e.id === animal.espece_id) : null;
  const especeName = espece ? espece.nom : "-";

  // Titre
  doc.setFontSize(20);
  doc.setTextColor(31, 146, 172);
  doc.text("FICHE NOURRITURE", 105, 20, { align: "center" });

  // Ligne séparatrice
  doc.setDrawColor(31, 146, 172);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);

  // Contenu
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  let y = 40;

  doc.setFont(undefined, 'bold');
  doc.text("Animal:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(food.animalName || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Espece:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(especeName, 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Type:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(food.foodType || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Marque:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(food.brand || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Quantite:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(food.quantityKg ? food.quantityKg + " kg" : "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Prix:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(food.priceEur ? food.priceEur + " MAD" : "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Date d'achat:", 20, y);
  doc.setFont(undefined, 'normal');
  doc.text(food.purchaseDate || "-", 60, y);
  y += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Notes:", 20, y);
  doc.setFont(undefined, 'normal');
  const notes = food.notes || "Aucune note";
  const splitNotes = doc.splitTextToSize(notes, 130);
  doc.text(splitNotes, 60, y);

  // Pied de page
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text("Pet Manager - " + new Date().toLocaleDateString(), 105, 280, { align: "center" });

  // Téléchargement
  doc.save(`Nourriture_${food.animalName}_${food.id}.pdf`);
}

// ===== EVENTS =====
if (container) {
  container.addEventListener("click", function (e) {
    const detailsBtn = e.target.closest(".details");
    const editBtn = e.target.closest(".edit");
    const delBtn = e.target.closest(".del");

    if (detailsBtn) {
      const id = Number(detailsBtn.dataset.id);
      const food = filteredFood.find(f => f.id === id);
      if (!food) return;

      Swal.fire({
        title: `🍖 ${food.brand || "Nourriture"}`,
        width: '650px',
        html: `
          <div style="text-align:left; padding:20px; display:grid; gap:15px;">
            <p><strong>Animal:</strong> ${food.animalName || "-"}</p>
            <p><strong>Espèce:</strong> ${food.animalSpecies || "-"}</p>
            <p><strong>Type:</strong> ${food.foodType || "-"}</p>
            <p><strong>Marque:</strong> ${food.brand || "-"}</p>
            <p><strong>Quantité:</strong> ${food.quantityKg ? food.quantityKg + " kg" : "-"}</p>
            <p><strong>Prix:</strong> ${food.priceEur ? food.priceEur + " MAD" : "-"}</p>
            <p><strong>Date d'achat:</strong> ${food.purchaseDate || "-"}</p>
            <p><strong>Notes:</strong> ${food.notes || "-"}</p>
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
          exportFoodToPDF(food);
        }
      });
      return;
    }

    if (editBtn) {
      const id = Number(editBtn.dataset.id);
      editFoodModal(id);
      return;
    }

    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      Swal.fire({
        title: translations.confirm_title || "Confirmation",
        text: "Supprimer cet achat ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: translations.yes_delete || "Oui, supprimer",
        cancelButtonText: translations.cancel || "Annuler",
      }).then((result) => {
        if (!result.isConfirmed) return;

        const db = JSON.parse(localStorage.getItem("db") || "{}");
        db.foodPurchases = (db.foodPurchases || []).filter(f => f.id !== id);
        localStorage.setItem("db", JSON.stringify(db));

        loadFoodList();
        applyFiltersAndSearch();

        Swal.fire({
          icon: "success",
          title: "Supprimé",
          text: "Achat supprimé.",
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
    renderFoodList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

document.getElementById("nextBtn")?.addEventListener("click", function() {
  const totalPages = Math.ceil(filteredFood.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderFoodList();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// ===== FILTER & SEARCH EVENTS =====
document.getElementById("searchInput")?.addEventListener("input", applyFiltersAndSearch);
document.getElementById("filterAnimal")?.addEventListener("change", applyFiltersAndSearch);
document.getElementById("filterType")?.addEventListener("change", applyFiltersAndSearch);

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
      translations = data["nourriture/list"] || {};

      setText("title", translations.title || "Nourriture");

      const c = data.common || {};
      setText("titre", c.titre || "Pet Manager");
      setText("subtitle", c.subtitle || "");

      // Navigation
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

      // Filtres & boutons
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.placeholder = translations.search_placeholder || "🔍 Rechercher par animal...";

      const filterAnimalOption = document.querySelector("#filterAnimal option[value='']");
      if (filterAnimalOption) filterAnimalOption.textContent = translations.filter_animal || "Tous les animaux";

      const filterTypeOption = document.querySelector("#filterType option[value='']");
      if (filterTypeOption) filterTypeOption.textContent = translations.filter_type || "Tous les types";

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

      loadFoodList();
      populateAnimalFilter();
      applyFiltersAndSearch();
    })
    .catch(() => {
      document.documentElement.setAttribute("dir", dir);
      document.body.setAttribute("dir", dir);
      document.body.style.direction = dir;
      document.body.style.visibility = "visible";
      loadFoodList();
      populateAnimalFilter();
      applyFiltersAndSearch();
    });
}

document.getElementById("langue")?.addEventListener("change", languechoisie);

const saved = localStorage.getItem("lang") || "fr";
const langSelect = document.getElementById("langue");
if (langSelect) langSelect.value = saved;

// ===== INIT =====
loadFoodList();
populateAnimalFilter();
languechoisie();
