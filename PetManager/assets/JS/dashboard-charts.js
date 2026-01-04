let translations = {};
let especeNames = {};
let chartInstances = {};
let currentFilters = { period: 'all', species: 'all' };

// Traductions des types de nourriture et labels
let foodTypeTranslations = {};
let dashboardChartTranslations = {};

//chargement de la "base de données" depuis le localStorage
const KEY = "db";
function getDB() {
  return JSON.parse(localStorage.getItem(KEY) || "{}");
}

// Assurer que les tableaux existent dans la DB
function ensureDB() {
  const db = getDB();
  if (!Array.isArray(db.animals)) db.animals = [];
  if (!Array.isArray(db.vaccinations)) db.vaccinations = [];
  if (!Array.isArray(db.appointments)) db.appointments = [];
  if (!Array.isArray(db.foodPurchases)) db.foodPurchases = [];
  return db;
}

// Fonction pour filtrer par période
function filterByPeriod(dateStr, period, baseYear) {
  if (period === 'all') return true;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yearRef = baseYear || now.getFullYear();
  
  if (period === 'today') {
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return itemDate.getTime() === today.getTime();
  }
  
  if (period === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo && date <= now;
  }
  
  if (period === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === yearRef;
  }
  
  if (period === 'year') {
    return date.getFullYear() === yearRef;
  }
  
  return true;
}

// Fonction pour obtenir l'année la plus récente des entrées
function latestYearFromEntries(entries, dateField) {
  let maxYear = null;
  entries.forEach(e => {
    const d = new Date(e[dateField]);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      if (maxYear === null || y > maxYear) maxYear = y;
    }
  });
  return maxYear;
}

// Fonction pour filtrer par espèce
function filterBySpecies(animalId, speciesFilter) {
  if (speciesFilter === 'all') return true;
  
  const animaux = JSON.parse(localStorage.getItem("animaux") || "[]");
  const animal = animaux.find(a => a.id === animalId);
  
  return animal && String(animal.espece_id) === speciesFilter;
}

// Fonction pour obtenir la clé mois "YYYY-MM" à partir d'une date
function monthKey(d){
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth()+1).padStart(2,"0");
  return `${yyyy}-${mm}`;
}

// Initialiser un objet mois avec des zéros
function initMonths(year){
  const o = {};
  for(let m=1;m<=12;m++){
    const mm = String(m).padStart(2,"0");
    o[`${year}-${mm}`]=0;
  }
  return o;
}

// Mettre à jour le texte d'un élément par ID
function setText(id, val){
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Traduire un label de mois (ex: "2025-01" -> "Janvier")
function translateMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const monthNum = parseInt(month, 10);
  const monthNames = [
    'months_january', 'months_february', 'months_march', 'months_april',
    'months_may', 'months_june', 'months_july', 'months_august',
    'months_september', 'months_october', 'months_november', 'months_december'
  ];
  const key = monthNames[monthNum - 1];
  return dashboardChartTranslations[key] || ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][monthNum - 1];
}

// Traduire un type de nourriture
function translateFoodType(foodType) {
  return foodTypeTranslations[foodType] || foodType;
}

// Fonction pour créer un Pie Chart
function createPieChart(canvasId, data, labels) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  // Détruire le chart existant s'il y en a un avant de créer un nouveau
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  // Créer le nouveau chart
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#1f92ac', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 } }
        }
      }
    }
  });
}

// Fonction pour créer un Donut Chart
function createDonutChart(canvasId, data, labels) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: ['#17a2b8', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 12 } }
        }
      }
    }
  });
}

// Fonction pour créer un Line Chart
function createLineChart(canvasId, data, labels, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        borderColor: '#1f92ac',
        backgroundColor: 'rgba(31, 146, 172, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#1f92ac',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 11 } }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
}

// Fonction pour créer un Bar Chart
function createBarChart(canvasId, data, labels, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: '#28a745',
        borderColor: '#1e7e34',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 11 } }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
}
// Fonction principale pour calculer et afficher les données du dashboard
function computeAndRenderDashboard(){
  const db = ensureDB();
  let animaux = JSON.parse(localStorage.getItem("animaux") || "[]");
  const now = new Date();
  const currentYear = now.getFullYear();

  // Déterminer l'année la plus récente des données (filtrée par espèce seulement)
  const vaccBySpecies = db.vaccinations.filter(v => filterBySpecies(v.animalId, currentFilters.species));
  const rdvBySpecies = db.appointments.filter(a => filterBySpecies(a.animalId, currentFilters.species));
  const foodBySpecies = db.foodPurchases.filter(f => filterBySpecies(f.animalId, currentFilters.species));

  const latestYear = Math.max(
    latestYearFromEntries(vaccBySpecies, 'date') || 0,
    latestYearFromEntries(rdvBySpecies, 'date') || 0,
    latestYearFromEntries(foodBySpecies, 'purchaseDate') || 0
  ) || currentYear;

  // Pour les filtres "cette année" et "ce mois", on doit se baser sur l'année courante
  // et non sur la dernière année trouvée dans les données (sinon en 2026 on verrait 2025).
  const filterYear = (currentFilters.period === 'year' || currentFilters.period === 'month')
    ? currentYear
    : latestYear;

  // Appliquer filtres espèce sur animaux
  if (currentFilters.species !== 'all') {
    animaux = animaux.filter(a => String(a.espece_id) === currentFilters.species);
  }

  // Filtrer vaccinations
  let vaccinations = db.vaccinations.filter(v => {
    const periodMatch = filterByPeriod(v.date, currentFilters.period, filterYear);
    const speciesMatch = filterBySpecies(v.animalId, currentFilters.species);
    return periodMatch && speciesMatch;
  });

  // Filtrer appointments
  let appointments = db.appointments.filter(a => {
    const periodMatch = filterByPeriod(a.date, currentFilters.period, filterYear);
    const speciesMatch = filterBySpecies(a.animalId, currentFilters.species);
    return periodMatch && speciesMatch;
  });

  // Filtrer foodPurchases
  let foodPurchases = db.foodPurchases.filter(f => {
    const periodMatch = filterByPeriod(f.purchaseDate, currentFilters.period, filterYear);
    const speciesMatch = filterBySpecies(f.animalId, currentFilters.species);
    return periodMatch && speciesMatch;
  });

  // KPI
  setText("kpi_animals", animaux.length);
  setText("kpi_vax", vaccinations.length);
  setText("kpi_rdv", appointments.length);
  setText("kpi_food", foodPurchases.length);

  const foodCost = foodPurchases.reduce((s,p)=> s + (Number(p.priceEur)||0), 0);
  const vaxCost = vaccinations.reduce((s,v)=> s + (Number(v.priceEur)||0), 0);

  setText("kpi_food_cost", foodCost.toFixed(2) + " MAD");
  setText("kpi_vax_cost", vaxCost.toFixed(2) + " MAD");

  // 1) Animaux par espèce - PIE CHART
  const bySpecies = {};
  animaux.forEach(a=>{
    const s = especeNames[String(a.espece_id)] || "Inconnu";
    bySpecies[s] = (bySpecies[s]||0)+1;
  });
  const speciesLabels = Object.keys(bySpecies);
  const speciesData = Object.values(bySpecies);
  createPieChart("chart_species", speciesData, speciesLabels);

  // 2) Achats nourriture par type - DONUT CHART
  const byFoodType = {};
  foodPurchases.forEach(p=>{
    const t = p.foodType || "Autre";
    byFoodType[t] = (byFoodType[t]||0)+1;
  });
  const foodLabels = Object.keys(byFoodType).map(f => translateFoodType(f));
  const foodData = Object.values(byFoodType);
  createDonutChart("chart_foodtype", foodData, foodLabels);

  // 3) RDV par mois - LINE CHART
  const rdvMonths = initMonths(filterYear);
  appointments.forEach(r=>{
    const k = monthKey(r.date);
    if (!k || !rdvMonths.hasOwnProperty(k)) return;
    rdvMonths[k] += 1;
  });
  const rdvLabels = Object.keys(rdvMonths).map(k => translateMonthLabel(k));
  const rdvData = Object.values(rdvMonths);
  const appointmentLabel = dashboardChartTranslations.chart_label_appointments || "Rendez-vous";
  createLineChart("chart_rdv_month", rdvData, rdvLabels, appointmentLabel);

  // 4) Dépenses nourriture par mois - BAR CHART
  const foodMonths = initMonths(filterYear);
  foodPurchases.forEach(p=>{
    const k = monthKey(p.purchaseDate);
    if (!k || !foodMonths.hasOwnProperty(k)) return;
    foodMonths[k] += (Number(p.priceEur)||0);
  });
  const foodMonthLabels = Object.keys(foodMonths).map(k => translateMonthLabel(k));
  const foodMonthData = Object.values(foodMonths);
  const expenseLabel = dashboardChartTranslations.chart_label_expenses || "Dépenses (MAD)";
  createBarChart("chart_food_month", foodMonthData, foodMonthLabels, expenseLabel);

  // 5) Dépenses vaccins par mois - LINE CHART
  const vaxMonths = initMonths(filterYear);
  vaccinations.forEach(v=>{
    const k = monthKey(v.date);
    if (!k || !vaxMonths.hasOwnProperty(k)) return;
    vaxMonths[k] += (Number(v.priceEur)||0);
  });
  const vaxMonthLabels = Object.keys(vaxMonths).map(k => translateMonthLabel(k));
  const vaxMonthData = Object.values(vaxMonths);
  createLineChart("chart_vax_month", vaxMonthData, vaxMonthLabels, expenseLabel);
}

// Remplir le filtre des espèces
function populateSpeciesFilter() {
  const especes = JSON.parse(localStorage.getItem("especes") || "[]");
  const select = document.getElementById("filterSpecies");
  if (!select) return;
  
  const allSpeciesText = translations.all_species_option || "Toutes les espèces";
  select.innerHTML = `<option value="all">${allSpeciesText}</option>`;
  especes.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = `${e.emoji} ${especeNames[String(e.id)] || e.nom}`;
    select.appendChild(opt);
  });
}

// Gérer les changements de filtres
function setupFilterListeners() {
  const periodFilter = document.getElementById("filterPeriod");
  const speciesFilter = document.getElementById("filterSpecies");
  const resetBtn = document.getElementById("btnResetFilters");
  
  if (periodFilter) {
    periodFilter.addEventListener("change", () => {
      currentFilters.period = periodFilter.value;
      computeAndRenderDashboard();
    });
  }
  
  if (speciesFilter) {
    speciesFilter.addEventListener("change", () => {
      currentFilters.species = speciesFilter.value;
      computeAndRenderDashboard();
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      currentFilters = { period: 'all', species: 'all' };
      if (periodFilter) {
        periodFilter.value = 'all';
        // Assurer que l'option "Toutes les périodes" est sélectionnée
        if (periodFilter.value !== 'all') {
          const allOpt = Array.from(periodFilter.options).find(o => o.value === 'all');
          if (allOpt) allOpt.selected = true;
        }
      }
      if (speciesFilter) speciesFilter.value = 'all';
      computeAndRenderDashboard();
    });
  }
}

// Fonction pour gérer le changement de langue
function languechoisie() {
  let langue = document.getElementById("langue").value;

  fetch("../languages/" + langue + ".json")
    .then((res) => res.json())
    .then((data) => {
      translations = data["dashboard"] || {};
      especeNames = data["especes/names"] || {};
      foodTypeTranslations = data["foodtypes"] || {};
      dashboardChartTranslations = data["dashboard_charts"] || {};

      document.getElementById("title").innerText = translations.title || "Dashboard";

      const c = data.common || {};
      document.getElementById("titre").innerText = c.titre || "Pet Manager";
      document.getElementById("subtitle").innerText = c.subtitle || "";
      document.getElementById("dashboard").querySelector("span").innerText = c.dashboard || "Dashboard";
      document.getElementById("animaux").querySelector("span").innerText = c.animaux || "Animaux";
      document.getElementById("nourriture").querySelector("span").innerText = c.nourriture || "Nourriture";
      document.getElementById("vaccinations").querySelector("span").innerText = c.vaccinations || "Vaccinations";
      document.getElementById("RDV").querySelector("span").innerText = c.RDV || "Rendez-vous";
      document.getElementById("espece").querySelector("span").innerText = c.espece || "Especes";
      document.getElementById("logout").innerText = c.logout || "Se deconnecter";

      // Translate dashboard elements
      setText("filterTitle", translations.filters_title || "📊 Filtres dynamiques");
      setText("labelPeriod", translations.period_label || "Période :");
      setText("labelSpecies", translations.species_label || "Espèce :");
      setText("optionAll", translations.all_periods_option || "Toutes les périodes");
      setText("optionToday", translations.today_option || "Aujourd'hui");
      setText("optionWeek", translations.week_option || "Cette semaine");
      setText("optionMonth", translations.month_option || "Ce mois");
      setText("optionYear", translations.year_option || "Cette année");
      setText("optionAllSpecies", translations.all_species_option || "Toutes les espèces");
      setText("btnResetFilters", translations.reset_filters_btn || "🔄 Réinitialiser");
      
      // Translate KPI labels
      setText("kpi_animals_label", translations.kpi_animals_label || "Total animaux");
      setText("kpi_vax_label", translations.kpi_vax_label || "Total vaccinations");
      setText("kpi_rdv_label", translations.kpi_rdv_label || "Total RDV");
      setText("kpi_food_label", translations.kpi_food_label || "Total achats nourriture");
      setText("kpi_food_cost_label", translations.kpi_food_cost_label || "Coût nourriture (total)");
      setText("kpi_vax_cost_label", translations.kpi_vax_cost_label || "Coût vaccins (total)");
      
      // Translate chart titles
      setText("chartTitle1", translations.chart1_title || "Animaux par espèce");
      setText("chartTitle2", translations.chart2_title || "Achats nourriture par type");
      setText("chartTitle3", translations.chart3_title || "RDV par mois (année)");
      setText("chartTitle4", translations.chart4_title || "Dépenses nourriture par mois (année)");
      setText("chartTitle5", translations.chart5_title || "Dépenses vaccins par mois (année)");

      localStorage.setItem("lang", langue);
      document.documentElement.lang = langue;
      document.documentElement.dir = (langue === "ar") ? "rtl" : "ltr";
      document.body.setAttribute("dir", document.documentElement.dir);
      document.body.style.direction = (langue === "ar") ? "rtl" : "ltr";

      // Au rechargement, on force le filtre période sur "toutes les périodes"
      const periodFilter = document.getElementById("filterPeriod");
      if (periodFilter) {
        periodFilter.value = "all";
        if (periodFilter.value !== "all") {
          const allOpt = Array.from(periodFilter.options).find(o => o.value === "all");
          if (allOpt) allOpt.selected = true;
        }
        currentFilters.period = "all";
      }

      // Afficher le nom de l'utilisateur depuis la session
      const session = JSON.parse(localStorage.getItem("sessionUser") || "null");
      if (session && session.email) {
        const userName = session.email.split('@')[0];
        document.getElementById("nom").innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      
      document.body.style.visibility = "visible";

      populateSpeciesFilter();
      setupFilterListeners();
      computeAndRenderDashboard();
    })
    .catch(() => {
      // Afficher le nom même en cas d'erreur
      const session = JSON.parse(localStorage.getItem("sessionUser") || "null");
      if (session && session.email) {
        const userName = session.email.split('@')[0];
        document.getElementById("nom").innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
      }
      
      document.body.style.visibility = "visible";
      populateSpeciesFilter();
      setupFilterListeners();
      computeAndRenderDashboard();
    });
}

// logout
document.getElementById("logout").addEventListener("click", () => {
  if (typeof logoutToIndex === "function") logoutToIndex();
  else window.location.href = "../index.html";
});

// events
document.getElementById("langue").addEventListener("change", languechoisie);

const saved = localStorage.getItem("lang") || "fr";
document.getElementById("langue").value = saved;

// Afficher le nom de l'utilisateur immédiatement
const session = JSON.parse(localStorage.getItem("sessionUser") || "null");
if (session && session.email) {
  const userName = session.email.split('@')[0];
  document.getElementById("nom").innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
}

languechoisie();
