const DB_KEY = "db";

function getDB() {
  return JSON.parse(localStorage.getItem(DB_KEY) || "{}");
}
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function ensureAnimalsInDB() {
  const db = getDB();
  
  // Initialiser si besoin
  if (!Array.isArray(db.animals)) db.animals = [];

  // TOUJOURS fusionner depuis localStorage "animaux" pour récupérer les nouveaux ajouts
  const alt = JSON.parse(localStorage.getItem("animaux") || "[]");
  if (Array.isArray(alt) && alt.length) {
    console.log("Fusion des animaux depuis localStorage 'animaux':", alt.length);
    
    // Fusionner sans doublons par id
    const map = new Map(db.animals.map(a => ({
      id: Number(a.id),
      name: a.name || a.nom || "Animal",
      species: a.species || a.espece || a.espece_emoji || ""
    })).map(a => [a.id, a]));
    
    alt.forEach(a => {
      const id = Number(a.id ?? a.ID);
      map.set(id, {
        id,
        name: a.name || a.nom || "Animal",
        species: a.species || a.espece || a.espece_emoji || ""
      });
    });
    
    db.animals = Array.from(map.values());
    saveDB(db);
    console.log("Total animaux après fusion:", db.animals.length);
  }

  return db.animals;
}

function fillAnimalsSelect() {
  // LIRE DIRECTEMENT depuis localStorage "animaux"
  const animaux = JSON.parse(localStorage.getItem("animaux") || "[]");
  const select = document.getElementById("animalId");
  if (!select) return;

  console.log("Total animaux dans localStorage:", animaux.length);
  
  select.innerHTML = `<option value="">Selectionner</option>`;
  animaux.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    // Support du format de database.json
    const name = a.nom || a.name || "Animal";
    const species = a.espece_emoji || a.espece || a.species || "";
    opt.textContent = species ? `${name} (${species})` : name;
    console.log("Option ajoutée:", opt.textContent, "ID:", a.id);
    select.appendChild(opt);
  });
  console.log(`${animaux.length} animaux ajoutés au dropdown`);
}

function getPurchases(db) {
  if (!Array.isArray(db.foodPurchases)) db.foodPurchases = [];
  return db.foodPurchases;
}

function nextId(arr) {
  return arr.length ? Math.max(...arr.map(x => Number(x.id || 0))) + 1 : 1;
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg || "";
}

function validateForm() {
  let ok = true;

  const animalId = document.getElementById("animalId").value.trim();
  const foodType = document.getElementById("foodType").value.trim();
  const quantityKg = Number(document.getElementById("quantityKg").value);
  const purchaseDate = document.getElementById("purchaseDate").value;
  const priceEur = Number(document.getElementById("priceEur").value);
  const brand = document.getElementById("brand").value.trim();

  setErr("errAnimal", "");
  setErr("errType", "");
  setErr("errQty", "");
  setErr("errDate", "");
  setErr("errPrice", "");
  setErr("errBrand", "");

  if (!animalId) { setErr("errAnimal", "Animal obligatoire."); ok = false; }
  if (!foodType) { setErr("errType", "Type obligatoire."); ok = false; }
  if (!(quantityKg > 0)) { setErr("errQty", "Quantité invalide."); ok = false; }
  if (!purchaseDate) { setErr("errDate", "Date obligatoire."); ok = false; }
  if (!(priceEur > 0)) { setErr("errPrice", "Prix invalide."); ok = false; }
  if (!brand) { setErr("errBrand", "Marque obligatoire."); ok = false; }

  return ok;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Attendre que la base de données soit chargée
  await new Promise(resolve => {
    const checkDB = setInterval(() => {
      const db = JSON.parse(localStorage.getItem('db') || '{}');
      if (db.animals && db.animals.length > 0) {
        clearInterval(checkDB);
        resolve();
      }
    }, 50);
    // Timeout après 3 secondes
    setTimeout(() => {
      clearInterval(checkDB);
      resolve();
    }, 3000);
  });

  fillAnimalsSelect();

  const params = new URLSearchParams(window.location.search);
  const editId = Number(params.get("id") || 0);
  let editingPurchase = null;

  if (editId) {
    const db = getDB();
    const purchases = getPurchases(db);
    editingPurchase = purchases.find(p => Number(p.id) === editId) || null;

    if (editingPurchase) {
      const animalField = document.getElementById("animalId");
      if (animalField) animalField.value = String(editingPurchase.animalId || "");
      const foodTypeField = document.getElementById("foodType");
      if (foodTypeField) foodTypeField.value = editingPurchase.foodType || "";
      const quantityField = document.getElementById("quantityKg");
      if (quantityField) quantityField.value = editingPurchase.quantityKg ?? "";
      const purchaseField = document.getElementById("purchaseDate");
      if (purchaseField) purchaseField.value = editingPurchase.purchaseDate || "";
      const priceField = document.getElementById("priceEur");
      if (priceField) priceField.value = editingPurchase.priceEur ?? "";
      const brandField = document.getElementById("brand");
      if (brandField) brandField.value = editingPurchase.brand || "";
      const notesField = document.getElementById("notes");
      if (notesField) notesField.value = editingPurchase.notes || "";
    }
  }

  const form = document.getElementById("foodForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const db = getDB();
    const purchases = getPurchases(db);

    // Récupérer l'ID sélectionné (string du dropdown)
    const selectedAnimalIdStr = document.getElementById("animalId").value;
    
    // LIRE depuis le même endroit que fillAnimalsSelect() : localStorage "animaux"
    const animals = JSON.parse(localStorage.getItem("animaux") || "[]");
    
    // Chercher par ID (en comparant les strings directement ou après conversion)
    const selectedAnimal = animals.find(a => {
      const aIdStr = String(a.id);
      return aIdStr === selectedAnimalIdStr;
    });

    console.log("Animal sélectionné:", selectedAnimalIdStr, selectedAnimal);

    const payload = {
      animalId: selectedAnimalIdStr,
      animalName: selectedAnimal ? (selectedAnimal.nom || selectedAnimal.name) : "Inconnu",
      animalSpecies: selectedAnimal ? (selectedAnimal.espece_emoji || selectedAnimal.espece || selectedAnimal.species) : "",
      foodType: document.getElementById("foodType").value,
      quantityKg: Number(document.getElementById("quantityKg").value),
      purchaseDate: document.getElementById("purchaseDate").value,
      priceEur: Number(document.getElementById("priceEur").value),
      brand: document.getElementById("brand").value.trim(),
      notes: document.getElementById("notes").value.trim()
    };

    if (editingPurchase) {
      const idx = purchases.findIndex(p => Number(p.id) === editId);
      if (idx !== -1) {
        purchases[idx] = { ...purchases[idx], ...payload, id: purchases[idx].id, updatedAt: new Date().toISOString() };
      }
      db.foodPurchases = purchases;
      saveDB(db);

      Swal.fire({
        icon: "success",
        title: "Succès",
        text: `Achat mis à jour pour ${payload.animalName}`,
        timer: 1200,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "./list.html";
      });
      return;
    }

    const newPurchase = {
      id: nextId(purchases),
      ...payload,
      createdAt: new Date().toISOString()
    };

    purchases.push(newPurchase);
    db.foodPurchases = purchases;
    saveDB(db);

    Swal.fire({
      icon: "success",
      title: "Succès",
      text: `Achat ajouté pour ${newPurchase.animalName}`,
      timer: 1200,
      showConfirmButton: false
    }).then(() => {
      window.location.href = "./list.html";
    });
  });
});
