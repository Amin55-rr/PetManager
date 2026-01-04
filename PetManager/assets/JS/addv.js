const DB_KEY = "db";

function getDB(){ return JSON.parse(localStorage.getItem(DB_KEY) || "{}"); }
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function getAnimals(db){
  return Array.isArray(db.animals) ? db.animals : [];
}

function getVaccinations(db){
  if (!Array.isArray(db.vaccinations)) db.vaccinations = [];
  return db.vaccinations;
}

function nextId(arr){
  return arr.length ? Math.max(...arr.map(x => Number(x.id || 0))) + 1 : 1;
}

function setErr(id,msg){
  const el = document.getElementById(id);
  if (el) el.textContent = msg || "";
}

function validate(){
  let ok = true;

  const animalId = document.getElementById("animalId").value.trim();
  const vaccine = document.getElementById("vaccine").value.trim();
  const date = document.getElementById("date").value;
  const nextDate = document.getElementById("nextDate").value;
  const vet = document.getElementById("vet").value.trim();
  const price = Number(document.getElementById("priceEur").value);

  setErr("errAnimal","");
  setErr("errVaccine","");
  setErr("errDate","");
  setErr("errNext","");
  setErr("errVet","");
  setErr("errPrice","");

  if (!animalId){ setErr("errAnimal","Animal obligatoire."); ok=false; }
  if (!vaccine){ setErr("errVaccine","Vaccin obligatoire."); ok=false; }
  if (!date){ setErr("errDate","Date obligatoire."); ok=false; }
  if (!nextDate){ setErr("errNext","Prochaine dose obligatoire."); ok=false; }
  if (!vet){ setErr("errVet","Vétérinaire obligatoire."); ok=false; }
  if (!(price >= 0)){ setErr("errPrice","Prix invalide."); ok=false; }

  return ok;
}

function fillAnimals(){
  const db = getDB();
  const animals = getAnimals(db);
  const sel = document.getElementById("animalId");
  sel.innerHTML = `<option value="">Sélectionner</option>`;

  animals.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.species ? `${a.name} (${a.species})` : a.name;
    sel.appendChild(opt);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fillAnimals();

  const params = new URLSearchParams(window.location.search);
  const editId = Number(params.get("id") || 0);
  let editingVacc = null;

  if (editId) {
    const db = getDB();
    const vaccs = getVaccinations(db);
    editingVacc = vaccs.find(v => Number(v.id) === editId) || null;

    if (editingVacc) {
      const animalField = document.getElementById("animalId");
      if (animalField) animalField.value = String(editingVacc.animalId || "");
      const vaccineField = document.getElementById("vaccine");
      if (vaccineField) vaccineField.value = editingVacc.vaccine || "";
      const dateField = document.getElementById("date");
      if (dateField) dateField.value = editingVacc.date || "";
      const nextDateField = document.getElementById("nextDate");
      if (nextDateField) nextDateField.value = editingVacc.nextDate || "";
      const vetField = document.getElementById("vet");
      if (vetField) vetField.value = editingVacc.vet || "";
      const priceField = document.getElementById("priceEur");
      if (priceField) priceField.value = editingVacc.priceEur ?? "";
      const notesField = document.getElementById("notes");
      if (notesField) notesField.value = editingVacc.notes || "";
    }
  }

  document.getElementById("vaccForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    const db = getDB();
    const vaccs = getVaccinations(db);
    const animals = getAnimals(db);

    const selectedAnimalId = Number(document.getElementById("animalId").value);
    const selectedAnimal = animals.find(a => Number(a.id) === selectedAnimalId);

    const payload = {
      animalId: selectedAnimalId,
      animalName: selectedAnimal ? selectedAnimal.name : "Inconnu",
      vaccine: document.getElementById("vaccine").value.trim(),
      date: document.getElementById("date").value,
      nextDate: document.getElementById("nextDate").value,
      vet: document.getElementById("vet").value.trim(),
      priceEur: Number(document.getElementById("priceEur").value),
      notes: document.getElementById("notes").value.trim()
    };

    if (editingVacc) {
      const idx = vaccs.findIndex(v => Number(v.id) === editId);
      if (idx !== -1) {
        vaccs[idx] = { ...vaccs[idx], ...payload, id: vaccs[idx].id, updatedAt: new Date().toISOString() };
      }
      db.vaccinations = vaccs;
      saveDB(db);

      Swal.fire({
        icon: "success",
        title: "Succès",
        text: `Vaccination mise à jour pour ${payload.animalName}`,
        timer: 1200,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "./list.html";
      });
      return;
    }

    const newVacc = {
      id: nextId(vaccs),
      ...payload,
      createdAt: new Date().toISOString()
    };

    vaccs.push(newVacc);
    db.vaccinations = vaccs;
    saveDB(db);

    Swal.fire({
      icon: "success",
      title: "Succès",
      text: `Vaccination ajoutée pour ${newVacc.animalName}`,
      timer: 1200,
      showConfirmButton: false
    }).then(() => {
      window.location.href = "./list.html";
    });
  });
});
