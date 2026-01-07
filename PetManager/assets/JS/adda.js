const params = new URLSearchParams(window.location.search);
const editId = params.get("id");

let animaux = JSON.parse(localStorage.getItem("animaux") || "[]");
let especes = JSON.parse(localStorage.getItem("especes") || "[]");
let animalToEdit = null;
let translations = {};

// Utilitaire: appel sécurisé de Swal
function safeSwal(opts) {
  try { if (window.Swal && typeof Swal.fire === "function") Swal.fire(opts); } catch (_) {}
}

// ----------------------
// I18N - Charger et appliquer les traductions
// ----------------------
function applyTranslations() {
  const t = translations;
  
  // Title
  document.getElementById("title").textContent = t.title || "Ajout / Modification Animal";
  
  // Labels
  const label_name = document.getElementById("label_name");
  if (label_name) label_name.textContent = t.label_name || "Nom :";
  
  const label_birth_date = document.getElementById("label_birth_date");
  if (label_birth_date) label_birth_date.textContent = t.label_birth_date || "Date de naissance";
  
  const label_weight = document.getElementById("label_weight");
  if (label_weight) label_weight.textContent = t.label_weight || "Son poids (kg)";
  
  const label_sex = document.getElementById("label_sex");
  if (label_sex) label_sex.textContent = t.label_sex || "Sexe :";
  
  const label_species = document.getElementById("label_species");
  if (label_species) label_species.textContent = t.label_species || "Espèce :";
  
  const label_owner = document.getElementById("label_owner");
  if (label_owner) label_owner.textContent = t.label_owner || "Nom du propriétaire :";
  
  const account_title = document.getElementById("account_title");
  if (account_title) account_title.textContent = t.account_title || "Création du compte client";
  
  const label_email = document.getElementById("label_email");
  if (label_email) label_email.textContent = t.label_email || "Email du propriétaire";
  
  const label_password = document.getElementById("label_password");
  if (label_password) label_password.textContent = t.label_password || "Mot de passe";
  
  // Buttons
  const btn_save = document.getElementById("btn_save");
  if (btn_save) btn_save.textContent = t.btn_save || "Enregistrer";
  
  const annuler = document.getElementById("annuler");
  if (annuler) annuler.textContent = t.btn_cancel || "Annuler";
  
  // Placeholders
  const nom = document.getElementById("nom");
  if (nom) nom.placeholder = t.placeholder_name || "Ex : Michou";
  
  const proprietaire = document.getElementById("proprietaire");
  if (proprietaire) proprietaire.placeholder = t.placeholder_owner || "Ahmed";
  
  // Options sexe
  const option_male = document.getElementById("option_male");
  if (option_male) option_male.textContent = t.option_male || "Mâle";
  
  const option_female = document.getElementById("option_female");
  if (option_female) option_female.textContent = t.option_female || "Femelle";
}

// Charger les traductions en fonction de la langue sélectionnée
function loadLanguage() {
  const langue = document.getElementById("langue")?.value || localStorage.getItem("lang") || "fr";
  
  fetch("../../languages/" + langue + ".json")
    .then(r => r.json())
    .then(data => {
      translations = data["animaux/add"] || {};
      
      // Appliquer direction RTL pour l'arabe
      document.documentElement.lang = langue;
      document.documentElement.dir = (langue === "ar") ? "rtl" : "ltr";
      document.body.setAttribute("dir", document.documentElement.dir);
      document.body.style.direction = (langue === "ar") ? "rtl" : "ltr";
      
      localStorage.setItem("lang", langue);
      applyTranslations();
    })
    .catch(() => {
      applyTranslations();
    });
}

// ----------------------
// PEUPLER LE SELECT DES ESPÈCES
// ----------------------
function renderEspeceOptions(selectedId = null) {
  const select = document.getElementById("espece");
  if (!select) return;
  select.innerHTML = "";
  especes.forEach(es => {
    const opt = document.createElement("option");
    opt.value = es.id;
    opt.textContent = `${es.emoji || ""} ${es.nom || ""}`.trim();
    select.appendChild(opt);
  });
  if (selectedId) select.value = String(selectedId);
}

// ----------------------
// MODE MODIFICATION
// ----------------------
if (editId) {
  animalToEdit = animaux.find(a => Number(a.id) === Number(editId));

  if (!animalToEdit) {
    safeSwal({ 
      icon: "error", 
      title: translations.error_not_found || "Erreur", 
      text: translations.error_not_found || "Animal introuvable",
      customClass: { popup: 'swal-large-modal', title: 'swal-large-title' },
      didOpen: () => {
        const style = document.createElement('style');
        style.textContent = '.swal-large-modal { font-size: 16px !important; } .swal-large-title { font-size: 24px !important; }';
        document.head.appendChild(style);
      }
    });
    window.location.href = "list.html";
  }

  // Pré-remplir les champs modifiables
  document.getElementById("nom").value = animalToEdit.nom || "";
  document.getElementById("poids").value = animalToEdit.poids ?? "";
  document.getElementById("date_naissance").value = animalToEdit.date_naissance || "";
  document.getElementById("sexe").value = (animalToEdit.sexe || "").toLowerCase();

  // Peupler et sélectionner l'espèce
  renderEspeceOptions(animalToEdit.espece_id);

  // 🔒 champs BLOQUÉS (proprio/email/mdp)
  document.getElementById("email").value = animalToEdit.proprietaire_email || "";
  document.getElementById("email").disabled = true;

  document.getElementById("proprietaire").value = animalToEdit.proprietaire_nom || "";
  document.getElementById("proprietaire").disabled = true;

  document.getElementById("password").disabled = true;
} else {
  // Mode ajout: remplir options espèces
  renderEspeceOptions();
}

// ----------------------
// ACTION: ANNULER
// ----------------------
document.getElementById("annuler")?.addEventListener("click", () => {
  window.location.href = "list.html";
});

// ----------------------
// SUBMIT
// ----------------------
document.getElementById("formAnimal").addEventListener("submit", function (e) {
  e.preventDefault();

  const nom = document.getElementById("nom").value.trim();
  const poids = document.getElementById("poids").value;
  const dateNaissance = document.getElementById("date_naissance").value || null;
  const sexe = document.getElementById("sexe").value || null;
  const especeId = Number(document.getElementById("espece").value);
  const especeObj = especes.find(e => Number(e.id) === especeId) || {};

  if (!nom) {
    safeSwal({ 
      icon: "error", 
      title: "Erreur", 
      text: translations.error_name_required || "Le nom est obligatoire",
      customClass: { popup: 'swal-large-modal', title: 'swal-large-title' },
      didOpen: () => {
        const style = document.createElement('style');
        style.textContent = '.swal-large-modal { font-size: 16px !important; } .swal-large-title { font-size: 24px !important; }';
        document.head.appendChild(style);
      }
    });
    return;
  }

  if (animalToEdit) {
    // ✅ MODIFICATION COMPLÈTE
    animalToEdit.nom = nom;
    animalToEdit.poids = poids ? Number(poids) : null;
    animalToEdit.date_naissance = dateNaissance;
    animalToEdit.sexe = sexe;
    animalToEdit.espece_id = especeId;
    animalToEdit.espece_emoji = especeObj.emoji || animalToEdit.espece_emoji || "";

    safeSwal({ 
      icon: "success", 
      title: translations.success_updated_title || "Succès", 
      text: translations.success_updated_text || "Animal modifié avec succès", 
      timer: 1200, 
      showConfirmButton: false,
      customClass: { popup: 'swal-large-modal', title: 'swal-large-title' },
      didOpen: () => {
        const style = document.createElement('style');
        style.textContent = '.swal-large-modal { font-size: 16px !important; } .swal-large-title { font-size: 24px !important; }';
        document.head.appendChild(style);
      }
    });

  } else {
    // ➕ AJOUT
    const proprietaireNom = document.getElementById("proprietaire").value.trim();
    const proprietaireEmail = document.getElementById("email").value.trim();
    const proprietaireMdp = document.getElementById("password").value;

    if (!proprietaireNom || !proprietaireEmail || !proprietaireMdp) {
      safeSwal({ 
        icon: "error", 
        title: "Erreur", 
        text: "Propriétaire, email et mot de passe sont requis",
        customClass: { popup: 'swal-large-modal', title: 'swal-large-title' },
        didOpen: () => {
          const style = document.createElement('style');
          style.textContent = '.swal-large-modal { font-size: 16px !important; } .swal-large-title { font-size: 24px !important; }';
          document.head.appendChild(style);
        }
      });
      return;
    }

    const newAnimal = {
      id: Date.now(),
      nom,
      poids: poids ? Number(poids) : null,
      date_naissance: dateNaissance,
      sexe,
      proprietaire_nom: proprietaireNom,
      proprietaire_email: proprietaireEmail,
      espece_id: especeId,
      espece_emoji: especeObj.emoji || ""
    };

    animaux.push(newAnimal);

    // Optionnel: créer/mettre à jour compte client
    let comptes = JSON.parse(localStorage.getItem("comptes") || "[]");
    const idx = comptes.findIndex(c => c.email === proprietaireEmail);
    const compte = { nom: proprietaireNom, email: proprietaireEmail, mdp: proprietaireMdp };
    if (idx === -1) comptes.push(compte); else comptes[idx] = compte;
    localStorage.setItem("comptes", JSON.stringify(comptes));
    
    safeSwal({ 
      icon: "success", 
      title: translations.success_added_title || "Succès", 
      text: translations.success_added_text || "Animal ajouté avec succès", 
      timer: 1200, 
      showConfirmButton: false,
      customClass: { popup: 'swal-large-modal', title: 'swal-large-title' },
      didOpen: () => {
        const style = document.createElement('style');
        style.textContent = '.swal-large-modal { font-size: 16px !important; } .swal-large-title { font-size: 24px !important; }';
        document.head.appendChild(style);
      }
    });
  }

  localStorage.setItem("animaux", JSON.stringify(animaux));
  
  // Synchroniser avec db.animals pour les autres pages
  const db = JSON.parse(localStorage.getItem("db") || "{}");
  db.animals = animaux;
  localStorage.setItem("db", JSON.stringify(db));
  
  setTimeout(() => window.location.href = "list.html", 900);
});

// ----------------------
// INITIALISATION
// ----------------------
document.getElementById("langue")?.addEventListener("change", loadLanguage);

const saved = localStorage.getItem("lang") || "fr";
if (document.getElementById("langue")) document.getElementById("langue").value = saved;

loadLanguage();
