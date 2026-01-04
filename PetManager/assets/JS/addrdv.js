const DB_KEY = "db";

function getDB(){ return JSON.parse(localStorage.getItem(DB_KEY) || "{}"); }
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function getAnimals(db){
  return Array.isArray(db.animals) ? db.animals : [];
}
function getRDV(db){
  if (!Array.isArray(db.appointments)) db.appointments = [];
  return db.appointments;
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
  const animalName = document.getElementById("animalName").value.trim();
  const date = document.getElementById("date").value;
  const reason = document.getElementById("reason").value.trim();

  setErr("errAnimal","");
  setErr("errDate","");
  setErr("errReason","");

  if (!animalName){ setErr("errAnimal","Animal obligatoire."); ok=false; }
  if (!date){ setErr("errDate","Date obligatoire."); ok=false; }
  if (!reason){ setErr("errReason","Motif obligatoire."); ok=false; }

  return ok;
}

function fillAnimals(){
  const db = getDB();
  const animals = getAnimals(db);
  const sel = document.getElementById("animalName");
  sel.innerHTML = `<option value="">Sélectionner</option>`;

  animals.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.name; // RDV dans ton db actuel utilise animalName
    opt.textContent = a.species ? `${a.name} (${a.species})` : a.name;
    sel.appendChild(opt);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fillAnimals();

  const params = new URLSearchParams(window.location.search);
  const editId = Number(params.get("id") || 0);
  let editingRdv = null;

  if (editId) {
    const db = getDB();
    const rdvs = getRDV(db);
    editingRdv = rdvs.find(r => Number(r.id) === editId) || null;

    if (editingRdv) {
      const animalField = document.getElementById("animalName");
      if (animalField) animalField.value = editingRdv.animalName || "";
      const dateField = document.getElementById("date");
      if (dateField) dateField.value = editingRdv.date || "";
      const reasonField = document.getElementById("reason");
      if (reasonField) reasonField.value = editingRdv.reason || "";
    }
  }

  document.getElementById("rdvForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    const db = getDB();
    const rdvs = getRDV(db);

    const payload = {
      animalName: document.getElementById("animalName").value.trim(),
      date: document.getElementById("date").value,
      reason: document.getElementById("reason").value.trim()
    };

    if (editingRdv) {
      const idx = rdvs.findIndex(r => Number(r.id) === editId);
      if (idx !== -1) {
        rdvs[idx] = { ...rdvs[idx], ...payload, id: rdvs[idx].id, updatedAt: new Date().toISOString() };
      }
      db.appointments = rdvs;
      saveDB(db);

      Swal.fire({
        icon: "success",
        title: "Succès",
        text: `Rendez-vous mis à jour pour ${payload.animalName}`,
        timer: 1200,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "./list.html";
      });
      return;
    }

    const newRDV = {
      id: nextId(rdvs),
      ...payload,
      createdAt: new Date().toISOString()
    };

    rdvs.push(newRDV);
    db.appointments = rdvs;
    saveDB(db);

    Swal.fire({
      icon: "success",
      title: "Succès",
      text: `Rendez-vous ajouté pour ${newRDV.animalName}`,
      timer: 1200,
      showConfirmButton: false
    }).then(() => {
      window.location.href = "./list.html";
    });
  });
});
