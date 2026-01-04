// ======================================================
//  GESTION DE LA LANGUE (identique à lista.js)
// ======================================================
let translations = {};
let especeNames = {}; // traductions des noms d'espèces

function languechoisie() {
    let languechoisie = document.getElementById("langue").value;

    fetch("../../languages/" + languechoisie + ".json")
        .then(res => res.json())
        .then(data => {
            let t = data["animaux/edit"] || data["animaux/list"];
            translations = t;
            especeNames = data["especes/names"] || {};

            document.getElementById("title").innerText = t.title || "Modifier Animal";

            let c = data.common;
            document.getElementById("titre").innerText = c.titre;
            document.getElementById("subtitle").innerText = c.subtitle;

            document.getElementById("dashboard").querySelector("span").innerText = c.dashboard;
            document.getElementById("animaux").querySelector("span").innerText = c.animaux;
            document.getElementById("nourriture").querySelector("span").innerText = c.nourriture;
            document.getElementById("vaccinations").querySelector("span").innerText = c.vaccinations;
            document.getElementById("RDV").querySelector("span").innerText = c.RDV;
            document.getElementById("espece").querySelector("span").innerText = c.espece;

            document.getElementById("logout").innerText = c.logout;

            const session = JSON.parse(localStorage.getItem("sessionUser") || "null");
            if (session && session.email) {
              const userName = session.email.split('@')[0];
              document.getElementById("nom").innerText = userName.charAt(0).toUpperCase() + userName.slice(1);
            }

            localStorage.setItem("lang", languechoisie);
            document.body.style.direction = (localStorage.getItem("lang") === "ar") ? "rtl" : "ltr";
            document.body.style.visibility = "visible";
            
            // Re-render le select avec les traductions
            renderSelectEspeces();
        });
}

document.getElementById("langue").addEventListener("change", languechoisie);
let saved = localStorage.getItem("lang") || "fr";
document.getElementById("langue").value = saved;

// Charger la langue au début
languechoisie();

// Render initial du select
renderSelectEspeces();


// ======================================================
//  LOGOUT
// ======================================================
document.getElementById("logout").addEventListener("click", () => {
    window.location.href = "../../index.html";
});


// ======================================================
//  RÉCUPÉRER L'ID DE L'ANIMAL
// ======================================================
let animaux = JSON.parse(localStorage.getItem("animaux")) || [];

const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));

const animal = animaux.find(a => a.id === id);

if (!animal) {
    Swal.fire({
        icon: 'error',
        title: "Erreur",
        text: "Animal introuvable",
    });
    window.location.href = "list.html";
}


// ======================================================
//  REMPLIR LA LISTE D'ESPÈCES
// ======================================================
let especes = JSON.parse(localStorage.getItem("especes")) || [];
let selectEs = document.getElementById("es");

function renderSelectEspeces() {
    selectEs.innerHTML = "";
    especes.forEach(es => {
        let opt = document.createElement("option");
        opt.value = es.id;
        // Utiliser le nom traduit ou fallback
        const nomTraduit = especeNames[String(es.id)] || es.nom || "";
        opt.textContent = es.emoji + " " + nomTraduit;
        selectEs.appendChild(opt);
    });
    // Re-sélectionner l'espèce actuelle après re-render
    if (animal && animal.espece_id) {
        selectEs.value = animal.espece_id;
    }
}

// ======================================================
//  PRÉ-REMPLIR LE FORMULAIRE
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("animalName").value = animal.nom;
    document.getElementById("animalDate").value = animal.date_naissance;
    document.getElementById("animalPoids").value = animal.poids;
    document.getElementById("animalSexe").value = animal.sexe.toLowerCase();

    document.getElementById("proprioNom").value = animal.proprietaire_nom;
    document.getElementById("proprioEmail").value = animal.proprietaire_email;
    document.getElementById("proprioMdp").value = animal.proprietaire_mdp;

    // Espèce actuelle
    selectEs.value = animal.espece_id;
});


// ======================================================
//  SAUVEGARDER LA MODIFICATION
// ======================================================
document.getElementById("formEdit").addEventListener("submit", function (e) {
    e.preventDefault();

    const nomAnimal = document.getElementById("animalName").value;
    const dateAnimal = document.getElementById("animalDate").value;
    const poidsAnimal = document.getElementById("animalPoids").value;
    const sexeAnimal = document.getElementById("animalSexe").value;

    const proprioNom = document.getElementById("proprioNom").value;
    const proprioEmail = document.getElementById("proprioEmail").value;
    const proprioMdp = document.getElementById("proprioMdp").value;

    const especeID = Number(document.getElementById("es").value);
    const espece = especes.find(e => e.id === especeID);

    // Mise à jour de l'animal
    const index = animaux.findIndex(a => a.id === id);
    animaux[index] = {
        ...animaux[index],
        nom: nomAnimal,
        date_naissance: dateAnimal,
        poids: poidsAnimal,
        sexe: sexeAnimal,
        proprietaire_nom: proprioNom,
        proprietaire_email: proprioEmail,
        proprietaire_mdp: proprioMdp,
        espece_id: especeID,
        espece_emoji: espece.emoji
    };

    localStorage.setItem("animaux", JSON.stringify(animaux));


    // ==================================================
    //  METTRE À JOUR LE COMPTE CLIENT
    // ==================================================
    let comptes = JSON.parse(localStorage.getItem("comptes")) || [];
    let compteIndex = comptes.findIndex(c => c.email === animal.proprietaire_email);

    if (compteIndex !== -1) {
        comptes[compteIndex] = {
            ...comptes[compteIndex],
            nom: proprioNom,
            email: proprioEmail,
            mdp: proprioMdp
        };
        localStorage.setItem("comptes", JSON.stringify(comptes));
    }


    // SUCCESS
    Swal.fire({
        icon: 'success',
        title: "Succès",
        text: "Animal modifié avec succès",
        timer: 1200,
        showConfirmButton: false
    });

    setTimeout(() => {
        window.location.href = "list.html";
    }, 1300);
});
