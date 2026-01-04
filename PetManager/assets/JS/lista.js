// lista.js - Gestion de la liste des animaux
// Avec Pagination + Filtres + Recherche
let translations = {};
let especeNames = {};
let animaux = [];
let filteredAnimaux = [];
let currentPage = 1;
let pageSize = 10;
let sortColumn = "nom";
let sortDirection = "asc";

const container = document.getElementById("animalsList");

// ===== CHARGER DONNÉES =====
function loadAnimaux() {
  const stored = localStorage.getItem("animaux");
  animaux = stored ? JSON.parse(stored) : [];
  filteredAnimaux = [...animaux];
}

// ===== APPLIQUER FILTRES =====
function applyFiltersAndSearch() {
  const searchTerm = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const speciesId = document.getElementById("filterSpecies")?.value || "";
  const sexFilter = (document.getElementById("filterSex")?.value || "").toLowerCase();

  filteredAnimaux = animaux.filter(a => {
    const matchSearch = !searchTerm || (a.nom || "").toLowerCase().includes(searchTerm);
    const matchSpecies = !speciesId || String(a.espece_id) === speciesId;
    const matchSex = !sexFilter || (a.sexe || "").toLowerCase() === sexFilter;
    return matchSearch && matchSpecies && matchSex;
  });

  // Appliquer le tri
  applySorting();
  
  currentPage = 1;
  renderAnimals();
  renderPagination();
}

//tri alphabétique et numérique
function applySorting() {
  filteredAnimaux.sort((a, b) => {
    let aVal, bVal;
    
    if (sortColumn === "nom") {
      aVal = (a.nom || "").toLowerCase();
      bVal = (b.nom || "").toLowerCase();
    } else if (sortColumn === "espece") {
      aVal = (especeNames[String(a.espece_id)] || "").toLowerCase();
      bVal = (especeNames[String(b.espece_id)] || "").toLowerCase();
    } else if (sortColumn === "sexe") {
      aVal = (a.sexe || "").toLowerCase();
      bVal = (b.sexe || "").toLowerCase();
    } else if (sortColumn === "poids") {
      aVal = a.poids || 0;
      bVal = b.poids || 0;
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
  const totalPages = Math.ceil(filteredAnimaux.length / pageSize);
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
        renderAnimals();
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      pageNumbers.appendChild(btn);
    }
  }
}

// ===== REMPLIR FILTRE ESPÈCES =====
function populateSpeciesFilter() {
  const select = document.getElementById("filterSpecies");
  if (!select) return;

  const speciesList = JSON.parse(localStorage.getItem("especes") || "[]");
  select.innerHTML = `<option value="">${translations.filter_species || "Toutes les espèces"}</option>`;
  
  speciesList.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e.id;
    // Utiliser le nom traduit de l'espèce depuis especeNames
    const especeName = especeNames[String(e.id)] || e.nom || "";
    opt.textContent = `${e.emoji || ""} ${especeName}`;
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

// ===== RENDU LISTE =====
function renderAnimals() {
  if (!container) return;

  container.innerHTML = "";

  // Pagination
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageAnimaux = filteredAnimaux.slice(start, end);

  if (!pageAnimaux.length) {
    const p = document.createElement("p");
    p.style.cssText = "padding:20px; opacity:0.7; text-align:center;";
    p.textContent = translations.empty || "Aucun animal.";
    container.appendChild(p);
    return;
  }

  pageAnimaux.forEach((animal) => {
    const bloc = document.createElement("div");
    bloc.classList.add("bloc");

    const h3 = document.createElement("h3");
    h3.textContent = `${animal.espece_emoji || ""} ${animal.nom || ""}`.trim();
    bloc.appendChild(h3);

    const addRow = (label, value) => {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = label;
      p.appendChild(strong);
      p.appendChild(document.createTextNode(" " + (value ?? "-")));
      return p;
    };

    const especeNomTraduit = especeNames[String(animal.espece_id)] || "Inconnu";
    bloc.appendChild(addRow(translations.espece || "Espèce :", especeNomTraduit));
    bloc.appendChild(addRow(translations.weight || "Poids :", animal.poids != null ? animal.poids + " kg" : "-"));
    bloc.appendChild(addRow(translations.birth_date || "Date de naissance :", animal.date_naissance));
    bloc.appendChild(addRow(translations.sex || "Sexe :", animal.sexe));
    bloc.appendChild(addRow(translations.owner || "Propriétaire :", animal.proprietaire_nom));
    bloc.appendChild(addRow(translations.email || "Email :", animal.proprietaire_email));

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;";

    const detailsBtn = document.createElement("button");
    detailsBtn.classList.add("details");
    detailsBtn.dataset.id = animal.id;
    detailsBtn.textContent = translations.details || "Voir détails";
    detailsBtn.style.cssText = "padding:8px 12px; background:#17a2b8; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px;";

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit");
    editBtn.dataset.id = animal.id;
    editBtn.textContent = translations.edit || "Modifier";

    const delBtn = document.createElement("button");
    delBtn.classList.add("del");
    delBtn.dataset.id = animal.id;
    delBtn.textContent = translations.delete || "Supprimer";

    actions.appendChild(detailsBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    bloc.appendChild(actions);
    container.appendChild(bloc);
  });
}

// ===== EXPORT PDF =====
function exportAnimalToPDF(animal) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(translations.animal_sheet || "FICHE ANIMAL", 105, 20, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  let y = 40;
  doc.setFontSize(12);
  
  // Nom
  doc.setFont("helvetica", "bold");
  doc.text(translations.name + ":", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(animal.nom || "-", 70, y);
  y += 10;
  
  // Espèce
  const especeNomTraduit = especeNames[String(animal.espece_id)] || "Inconnu";
  doc.setFont("helvetica", "bold");
  doc.text(translations.espece, 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(especeNomTraduit, 70, y);
  y += 10;
  
  // Poids
  doc.setFont("helvetica", "bold");
  doc.text(translations.weight?.replace(" :", "") + ":", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(animal.poids != null ? animal.poids + " kg" : "-", 70, y);
  y += 10;
  
  // Date de naissance
  doc.setFont("helvetica", "bold");
  doc.text(translations.birth_date, 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(animal.date_naissance || "-", 70, y);
  y += 10;
  
  // Sexe
  doc.setFont("helvetica", "bold");
  doc.text(translations.sex + ":", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(animal.sexe || "-", 70, y);
  y += 10;
  
  // Propriétaire
  doc.setFont("helvetica", "bold");
  doc.text(translations.owner + ":", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(animal.proprietaire_nom || "-", 70, y);
  y += 10;
  
  // Email
  doc.setFont("helvetica", "bold");
  doc.text(translations.email + ":", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(animal.proprietaire_email || "-", 70, y);
  
  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  const dateStr = new Date().toLocaleDateString('fr-FR');
  doc.text(`${translations.generated || "Généré le"} ${dateStr}`, 105, 280, { align: "center" });
  
  // Save
  doc.save(`Animal_${animal.nom}_${animal.id}.pdf`);
}

// ===== SUPPRESSION =====
function deleteAnimalEverywhere(id) {
  id = Number(id);

  // 1) supprimer dans "animaux"
  animaux = (animaux || []).filter((a) => Number(a.id) !== id);
  localStorage.setItem("animaux", JSON.stringify(animaux));

  // 2) supprimer aussi dans db.animals si existe
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  if (Array.isArray(db.animals)) {
    db.animals = db.animals.filter((a) => Number(a.id) !== id);
    localStorage.setItem("db", JSON.stringify(db));
  }
  
  applyFiltersAndSearch();
}

// ===== EDIT MODAL =====
async function editAnimalModal(id) {
  const animal = animaux.find(a => Number(a.id) === Number(id));
  if (!animal) return;

  let especes = JSON.parse(localStorage.getItem("especes") || "[]");
  const especeOptions = especes.map(e => {
    const label = `${e.emoji || ""} ${e.nom || ""}`;
    return `<option value="${e.id}">${escapeHtml(label)}</option>`;
  }).join("");

  const { value: formValues } = await Swal.fire({
    title: translations.edit_title || "Modifier animal",
    width: '750px',
    customClass: {
      popup: 'swal-large-modal',
      title: 'swal-large-title'
    },
    html: `
      <style>
        .swal-large-modal { font-size: 16px; padding: 30px; overflow-x: hidden !important; }
        .swal-large-title { font-size: 26px !important; }
        .swal2-input, .swal2-textarea, .swal2-select { font-size: 15px !important; }
        .swal2-html-container { overflow-x: hidden !important; }
        .swal2-container { z-index: 99999 !important; }
        .swal2-backdrop-show { background: rgba(0, 0, 0, 0.6) !important; pointer-events: auto !important; }
      </style>
      <div style="text-align:left; display:grid; gap:18px; padding:10px;">
        <div>
          <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.name || "Nom")}</label>
          <input id="swalNom" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(animal.nom || "")}">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.birth_date || "Date de naissance")}</label>
            <input id="swalDate" type="date" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(animal.date_naissance || "")}">
          </div>
          <div>
            <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.weight || "Poids (kg)")}</label>
            <input id="swalPoids" type="number" min="0" step="0.1" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;" value="${escapeHtml(animal.poids ?? "")}">
          </div>
        </div>

        <div>
          <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.sex || "Sexe")}</label>
          <select id="swalSexe" class="swal2-input" style="width:100%; border:1px solid #d0d0d0; border-radius:8px; padding:12px; font-size:15px;">
            <option value="male" ${animal.sexe?.toLowerCase() === 'male' ? 'selected' : ''}>Male</option>
            <option value="femelle" ${animal.sexe?.toLowerCase() === 'femelle' ? 'selected' : ''}>Femelle</option>
          </select>
        </div>

        <div>
          <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.owner || "Propriétaire")} <span style="color:#999; font-size:13px;">(non modifiable)</span></label>
          <input id="swalProprietaire" class="swal2-input" style="width:100%; background:#f5f5f5; cursor:not-allowed; font-size:15px; padding:12px; border:1px solid #d0d0d0; border-radius:8px;" value="${escapeHtml(animal.proprietaire_nom || "")}" disabled>
        </div>

        <div>
          <label style="font-weight:600; color:#333; margin-bottom:8px; display:block; font-size:15px;">${escapeHtml(translations.email || "Email")} <span style="color:#999; font-size:13px;">(non modifiable)</span></label>
          <input id="swalEmail" type="email" class="swal2-input" style="width:100%; background:#f5f5f5; cursor:not-allowed; font-size:15px; padding:12px; border:1px solid #d0d0d0; border-radius:8px;" value="${escapeHtml(animal.proprietaire_email || "")}" disabled>
        </div>
      </div>
    `,
    showCancelButton: true,
    showCloseButton: false,
    allowOutsideClick: false,
    backdrop: true,
    confirmButtonText: translations.save || "Enregistrer",
    confirmButtonColor: '#1f92ac',
    cancelButtonText: translations.cancel || "Annuler",
    preConfirm: () => {
      const nom = document.getElementById("swalNom").value.trim();
      const date = document.getElementById("swalDate").value;
      const poids = document.getElementById("swalPoids").value;
      const sexe = document.getElementById("swalSexe").value;

      if (!nom) { 
        Swal.showValidationMessage(translations.err_name || "Le nom est obligatoire."); 
        return false; 
      }

      return { nom, date_naissance: date, poids: poids ? Number(poids) : null, sexe };
    }
  });

  if (!formValues) return;

  // Mettre à jour l'animal (garder espèce et propriétaire inchangés)
  const oldName = animal.nom;
  animal.nom = formValues.nom;
  animal.date_naissance = formValues.date_naissance;
  animal.poids = formValues.poids;
  animal.sexe = formValues.sexe;

  localStorage.setItem("animaux", JSON.stringify(animaux));

  // Synchroniser avec db.animals et toutes les entités liées
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  
  // 1. Mettre à jour db.animals
  if (Array.isArray(db.animals)) {
    const idx = db.animals.findIndex(a => Number(a.id) === Number(id));
    if (idx !== -1) {
      db.animals[idx] = {
        ...db.animals[idx],
        name: formValues.nom,
        species: animal.espece_emoji || db.animals[idx].species
      };
    }
  }

  // 2. Mettre à jour le nom dans foodPurchases
  if (Array.isArray(db.foodPurchases)) {
    db.foodPurchases.forEach(purchase => {
      if (Number(purchase.animalId) === Number(id)) {
        purchase.animalName = formValues.nom;
      }
    });
  }

  // 3. Mettre à jour le nom dans vaccinations
  if (Array.isArray(db.vaccinations)) {
    db.vaccinations.forEach(vacc => {
      if (Number(vacc.animalId) === Number(id)) {
        vacc.animalName = formValues.nom;
      }
    });
  }

  // 4. Mettre à jour le nom dans appointments (RDV)
  if (Array.isArray(db.appointments)) {
    db.appointments.forEach(rdv => {
      if (rdv.animalName === oldName || Number(rdv.animalId) === Number(id)) {
        rdv.animalName = formValues.nom;
      }
    });
  }

  localStorage.setItem("db", JSON.stringify(db));

  Swal.fire({
    icon: "success",
    title: translations.saved_title || "Succès",
    text: translations.saved_text || "Modification enregistrée.",
    timer: 900,
    showConfirmButton: false
  });

  applyFiltersAndSearch();
}

// ===== EVENTS (UN SEUL listener) =====
if (container) {
  container.addEventListener("click", function (e) {
    const delBtn = e.target.closest(".del");
    const editBtn = e.target.closest(".edit");
    const detailsBtn = e.target.closest(".details");

    // DETAILS
    if (detailsBtn) {
      const id = Number(detailsBtn.dataset.id);
      const animal = animaux.find(a => Number(a.id) === id);
      if (!animal) return;

      const especeNomTraduit = especeNames[String(animal.espece_id)] || "Inconnu";
      
      Swal.fire({
        title: `${animal.espece_emoji || ""} ${animal.nom}`,
        width: '600px',
        html: `
          <div style="text-align:left; padding:20px; display:grid; gap:15px;">
            <p><strong>${translations.espece || "Espèce"}:</strong> ${especeNomTraduit}</p>
            <p><strong>${translations.weight || "Poids"}:</strong> ${animal.poids != null ? animal.poids + " kg" : "-"}</p>
            <p><strong>${translations.birth_date || "Date de naissance"}:</strong> ${animal.date_naissance || "-"}</p>
            <p><strong>${translations.sex || "Sexe"}:</strong> ${animal.sexe || "-"}</p>
            <p><strong>${translations.owner || "Propriétaire"}:</strong> ${animal.proprietaire_nom || "-"}</p>
            <p><strong>${translations.email || "Email"}:</strong> ${animal.proprietaire_email || "-"}</p>
          </div>
        `,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: translations.export_pdf || '📥 Export PDF',
        denyButtonText: translations.edit || "Modifier",
        cancelButtonText: translations.close || "Fermer",
        confirmButtonColor: '#dc3545',
        denyButtonColor: '#1f92ac',
        cancelButtonColor: '#6c757d',
        showCloseButton: true
      }).then((result) => {
        if (result.isConfirmed) {
          exportAnimalToPDF(animal);
        } else if (result.isDenied) {
          editAnimalModal(id);
        }
      });
      return;
    }

    // DELETE
    if (delBtn) {
      const id = Number(delBtn.dataset.id);

      const animalASupprimer = (animaux || []).find((a) => Number(a.id) === id);
      const emailProprio = animalASupprimer?.proprietaire_email || null;

      Swal.fire({
        title: translations.confirm_title || "Confirmation",
        text: translations.confirm_delete || "Supprimer cet animal ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: translations.yes_delete || "Oui, supprimer",
        cancelButtonText: translations.cancel || "Annuler",
      }).then((result) => {
        if (!result.isConfirmed) return;

        deleteAnimalEverywhere(id);

        if (emailProprio) {
          const autresAnimaux = (animaux || []).filter((a) => a.proprietaire_email === emailProprio);
          if (autresAnimaux.length === 0) {
            let comptes = JSON.parse(localStorage.getItem("comptes") || "[]");
            comptes = comptes.filter((c) => c.email !== emailProprio);
            localStorage.setItem("comptes", JSON.stringify(comptes));
          }
        }

        Swal.fire({
          icon: "success",
          title: translations.deleted_title || "Supprimé",
          text: translations.deleted_text || "Animal supprimé.",
          timer: 900,
          showConfirmButton: false,
        });
      });

      return;
    }

    // EDIT
    if (editBtn) {
      const id = editBtn.dataset.id;
      editAnimalModal(id);
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
    renderAnimals();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

document.getElementById("nextBtn")?.addEventListener("click", function() {
  const totalPages = Math.ceil(filteredAnimaux.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderAnimals();
    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// ===== FILTER & SEARCH EVENTS =====
document.getElementById("searchInput")?.addEventListener("input", applyFiltersAndSearch);
document.getElementById("filterSpecies")?.addEventListener("change", applyFiltersAndSearch);
document.getElementById("filterSex")?.addEventListener("change", applyFiltersAndSearch);

// ===== LANGUE =====
function languechoisie() {
  const langue = document.getElementById("langue")?.value || "fr";

  fetch("../../languages/" + langue + ".json")
    .then((res) => res.json())
    .then((data) => {
      translations = data["animaux/list"] || {};
      especeNames = data["especes/names"] || {};

      setText("title", translations.title || "Animaux");
      setText("titre", data.common?.titre || "Pet Manager");
      setText("subtitle", data.common?.subtitle || "");

      // Navigation
      const nav = data.common || {};
      document.getElementById("dashboard")?.querySelector("span") && (document.getElementById("dashboard").querySelector("span").innerText = nav.dashboard || "Dashboard");
      document.getElementById("animaux")?.querySelector("span") && (document.getElementById("animaux").querySelector("span").innerText = nav.animaux || "Animaux");
      document.getElementById("nourriture")?.querySelector("span") && (document.getElementById("nourriture").querySelector("span").innerText = nav.nourriture || "Nourriture");
      document.getElementById("vaccinations")?.querySelector("span") && (document.getElementById("vaccinations").querySelector("span").innerText = nav.vaccinations || "Vaccinations");
      document.getElementById("RDV")?.querySelector("span") && (document.getElementById("RDV").querySelector("span").innerText = nav.RDV || "Rendez-vous");
      document.getElementById("espece")?.querySelector("span") && (document.getElementById("espece").querySelector("span").innerText = nav.espece || "Espèces");
      setText("logout", nav.logout || "Déconnexion");

      // Boutons et labels
      const addBtn = document.getElementById("add");
      if (addBtn) addBtn.textContent = translations.add_btn || "+ Ajout";
      
      const exportBtn = document.getElementById("exportBtn");
      if (exportBtn) exportBtn.textContent = translations.export_btn || "📥 Exporter CSV";
      
      const perPageLabel = document.getElementById("per_page_label");
      if (perPageLabel) perPageLabel.textContent = translations.per_page || "Par page:";
      
      const prevBtn = document.getElementById("prevBtn");
      if (prevBtn) prevBtn.textContent = translations.prev_btn || "← Précédent";
      
      const nextBtn = document.getElementById("nextBtn");
      if (nextBtn) nextBtn.textContent = translations.next_btn || "Suivant →";

      // Placeholders et filtres
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.placeholder = translations.search_placeholder || "🔍 Rechercher par nom...";
      
      const filterSpeciesOption = document.getElementById("filter_species_option");
      if (filterSpeciesOption) filterSpeciesOption.textContent = translations.filter_species || "Toutes les espèces";
      
      const filterSexAllOption = document.getElementById("filter_sex_all_option");
      if (filterSexAllOption) filterSexAllOption.textContent = translations.filter_sex_all || "Tous les sexes";
      
      const filterSexMaleOption = document.getElementById("filter_sex_male_option");
      if (filterSexMaleOption) filterSexMaleOption.textContent = translations.filter_sex_male || "Mâle";
      
      const filterSexFemaleOption = document.getElementById("filter_sex_female_option");
      if (filterSexFemaleOption) filterSexFemaleOption.textContent = translations.filter_sex_female || "Femelle";

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

      // User info
      const session = JSON.parse(localStorage.getItem("sessionUser") || "null");
      if (session && session.email) {
        const userName = session.email.split('@')[0];
        setText("nom", userName.charAt(0).toUpperCase() + userName.slice(1));
      }

      // RTL support
      localStorage.setItem("lang", langue);
      document.documentElement.lang = langue;
      document.documentElement.dir = langue === "ar" ? "rtl" : "ltr";
      document.body.setAttribute("dir", document.documentElement.dir);
      document.body.style.direction = langue === "ar" ? "rtl" : "ltr";

      document.body.style.visibility = "visible";

      loadAnimaux();
      populateSpeciesFilter();
      applyFiltersAndSearch();
    })
    .catch(() => {
      document.body.style.visibility = "visible";
      loadAnimaux();
      populateSpeciesFilter();
      applyFiltersAndSearch();
    });
}

// ===== EXPORT CSV =====
function exportToCSV() {
  if (!filteredAnimaux.length) {
    Swal.fire({ 
      icon: "warning", 
      title: translations.no_data_export || "Aucune donnée", 
      text: translations.no_data_export_text || "Il n'y a rien à exporter." 
    });
    return;
  }

  const headers = [
    translations.name || "Nom", 
    translations.espece?.replace(" :", "") || "Espèce", 
    translations.sex?.replace(" :", "") || "Sexe", 
    translations.weight?.replace(" :", "") || "Poids (kg)", 
    translations.birth_date?.replace(" :", "") || "Date de naissance", 
    translations.owner?.replace(" :", "") || "Propriétaire", 
    translations.email?.replace(" :", "") || "Email"
  ];
  const rows = filteredAnimaux.map(a => [
    a.nom || "",
    especeNames[String(a.espece_id)] || "",
    a.sexe || "",
    a.poids ?? "",
    a.date_naissance || "",
    a.proprietaire_nom || "",
    a.proprietaire_email || ""
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach(row => {
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `animaux_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

const saved = localStorage.getItem("lang") || "fr";
const langSelect = document.getElementById("langue");
if (langSelect) {
  langSelect.value = saved;
  langSelect.addEventListener("change", languechoisie);
}

// ===== INIT =====
loadAnimaux();
populateSpeciesFilter();
languechoisie();
