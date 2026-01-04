// ===============================================================

async function initializeDatabase() {
  try {
    const isInPages = window.location.pathname.includes('/pages/');
    const dataPath = isInPages ? '../../data/database.json' : './data/database.json';

    const response = await fetch(dataPath);
    if (!response.ok) {
      console.error('Erreur chargement database.json');
      return false;
    }

    const database = await response.json();

    const existingAnimaux = JSON.parse(localStorage.getItem('animaux') || '[]');
    if (!existingAnimaux.length) {
      localStorage.setItem('animaux', JSON.stringify(database.animaux || []));
    }

    const db = JSON.parse(localStorage.getItem('db') || '{}');
    db.animals = db.animals && db.animals.length ? db.animals : (database.animaux || []);
    db.foodPurchases = db.foodPurchases || (database.nourriture || []);
    db.vaccinations = db.vaccinations || (database.vaccinations || []);
    db.appointments = db.appointments || (database.appointments || []);
    localStorage.setItem('db', JSON.stringify(db));

    const existingComptes = JSON.parse(localStorage.getItem('comptes') || '[]');
    const comptesMap = new Map();

    const pushCompte = (c) => {
      if (!c || !c.email) return;
      comptesMap.set(c.email, {
        nom: c.nom || 'Utilisateur',
        email: c.email,
        mdp: c.mdp || 'password123'
      });
    };

    existingComptes.forEach(pushCompte);
    (Array.isArray(database.comptes) ? database.comptes : []).forEach(pushCompte);

    const mergedComptes = Array.from(comptesMap.values());
    localStorage.setItem('comptes', JSON.stringify(mergedComptes));
    console.log(`  - ${mergedComptes.length} comptes disponibles`);

    console.log('✓ Base de données prête');
    return true;
  } catch (error) {
    console.error('Erreur initialisation base de données:', error);
    return false;
  }
}

// Charger au démarrage
document.addEventListener('DOMContentLoaded', async () => {
  await initializeDatabase();
  localStorage.setItem('lastDatabaseLoad', new Date().getTime().toString());
});
