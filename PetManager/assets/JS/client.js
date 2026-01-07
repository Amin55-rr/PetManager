document.addEventListener("DOMContentLoaded", () => {
  // 1) récupérer l'utilisateur connecté (2 formats possibles)
  const currentUser =
    JSON.parse(localStorage.getItem("currentUser") || "null") ||
    JSON.parse(localStorage.getItem("sessionUser") || "null");

  if (!currentUser || !currentUser.email) {
    // pas connecté
    window.location.href = "../../index.html";
    return;
  }

  // 2) afficher infos
  const nom = currentUser.nom || localStorage.getItem("nom") || currentUser.email.split("@")[0];
  const meEmailEl = document.getElementById("meEmail");
  const meNameEl = document.getElementById("meName");

  if (meEmailEl) meEmailEl.textContent = currentUser.email;
  if (meNameEl) meNameEl.textContent = nom;

  // 3) bouton logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("sessionUser");
      window.location.href = "../../index.html";
    });
  }

  // 4) charger les données
  const db = JSON.parse(localStorage.getItem("db") || "{}");

  //  TES ANIMAUX sont ici (localStorage "animaux")
  const animauxLS = JSON.parse(localStorage.getItem("animaux") || "[]");

  // fallback si jamais tu utilises aussi db.animals
  const animalsDb = Array.isArray(db.animals) ? db.animals : [];

  const foodDb = Array.isArray(db.foodPurchases) ? db.foodPurchases : [];
  const vaccDb = Array.isArray(db.vaccinations) ? db.vaccinations : [];
  const rdvDb = Array.isArray(db.appointments) ? db.appointments : [];

  // 5) récupérer MES animaux via email (ownerEmail OU proprietaire_email)
  const myAnimals = animauxLS.filter(a =>
    (a.ownerEmail === currentUser.email) || (a.proprietaire_email === currentUser.email)
  );

  // fallback si l’utilisateur n’a pas d’animaux dans animauxLS
  // (si tu utilises db.animals avec ownerEmail)
  const myAnimalsFallback = animalsDb.filter(a => a.ownerEmail === currentUser.email);

  const finalAnimals = myAnimals.length ? myAnimals : myAnimalsFallback;

  // 6) sets de noms/ids (pour filtrer nourriture/vacc/rdv)
  const myAnimalNames = new Set(
    finalAnimals
      .map(a => a.nom || a.name) // ton format = nom
      .filter(Boolean)
  );

  const myAnimalIds = new Set(
    finalAnimals
      .map(a => Number(a.id))
      .filter(n => !Number.isNaN(n))
  );

  // =====================
  // RENDER ANIMAUX
  // =====================
  const animalsUl = document.getElementById("myAnimals");
  const noAnimals = document.getElementById("noAnimals");
  if (animalsUl) animalsUl.innerHTML = "";

  if (!finalAnimals.length) {
    if (noAnimals) noAnimals.style.display = "block";
  } else {
    if (noAnimals) noAnimals.style.display = "none";
    finalAnimals.forEach(a => {
      const li = document.createElement("li");
      const name = a.nom || a.name || "Animal";
      const esp = a.espece_nom || a.species || "";
      const emoji = a.espece_emoji || "";
      li.textContent = `${emoji} ${name}${esp ? " (" + esp + ")" : ""}`;
      animalsUl && animalsUl.appendChild(li);
    });
  }

  // =====================
  // FILTRER NOURRITURE
  // =====================
  const myFood = foodDb.filter(f => {
    if (f.animalId != null) return myAnimalIds.has(Number(f.animalId));
    if (f.animalName) return myAnimalNames.has(f.animalName);
    return false;
  });

  const foodUl = document.getElementById("myFood");
  const noFood = document.getElementById("noFood");
  if (foodUl) foodUl.innerHTML = "";

  if (!myFood.length) {
    if (noFood) noFood.style.display = "block";
  } else {
    if (noFood) noFood.style.display = "none";
    myFood.forEach(f => {
      const li = document.createElement("li");
      li.textContent = `${f.animalName || "Animal"} — ${f.foodType || ""} — ${f.quantityKg ?? ""}kg — ${f.purchaseDate || ""}`;
      foodUl && foodUl.appendChild(li);
    });
  }

  // =====================
  // FILTRER VACCINATIONS
  // =====================
  const myVacc = vaccDb.filter(v => {
    if (v.animalId != null) return myAnimalIds.has(Number(v.animalId));
    if (v.animalName) return myAnimalNames.has(v.animalName);
    return false;
  });

  const vaccUl = document.getElementById("myVacc");
  const noVacc = document.getElementById("noVacc");
  if (vaccUl) vaccUl.innerHTML = "";

  if (!myVacc.length) {
    if (noVacc) noVacc.style.display = "block";
  } else {
    if (noVacc) noVacc.style.display = "none";
    myVacc.forEach(v => {
      const li = document.createElement("li");
      li.textContent = `${v.animalName || "Animal"} — ${v.vaccine || ""} — ${v.date || ""}`;
      vaccUl && vaccUl.appendChild(li);
    });
  }

  // =====================
  // FILTRER RDV (animalName)
  // =====================
  const myRdv = rdvDb.filter(r => myAnimalNames.has(r.animalName));

  const rdvUl = document.getElementById("myRdv");
  const noRdv = document.getElementById("noRdv");
  if (rdvUl) rdvUl.innerHTML = "";

  if (!myRdv.length) {
    if (noRdv) noRdv.style.display = "block";
  } else {
    if (noRdv) noRdv.style.display = "none";
    myRdv.forEach(r => {
      const li = document.createElement("li");
      li.textContent = `${r.animalName} — ${r.date || ""} — ${r.reason || ""}`;
      rdvUl && rdvUl.appendChild(li);
    });
  }
});
