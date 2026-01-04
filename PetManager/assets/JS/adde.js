let translations = {};
let especeNames = {}; // contiendra data["especes/names"]

const select = document.getElementById("selectEspece");

function renderSelect() {
    if (!select) return;

    // vider et reconstruire les options
    select.innerHTML = "";

    especesBase.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.id;

        // traduction par id (ex: especeNames["1"]) sinon fallback sur e.nom (fr)
        const translatedName = especeNames[String(e.id)] || e.nom;

        opt.textContent = `${e.emoji} ${translatedName}`;
        select.appendChild(opt);
    });
}

function languechoisie() {
    let lang = localStorage.getItem("lang") || "fr";

    fetch("../../languages/" + lang + ".json")
        .then(res => res.json())
        .then(data => {
            // Traductions page "Ajout espèce"
            const t = data["especes/add"] || {};
            translations = t;

            // Traductions noms d'espèces
            especeNames = data["especes/names"] || {};

            // Appliquer textes UI
            if (document.getElementById("title"))
                document.getElementById("title").innerText = t.title || "Ajout Espèce";

            if (document.getElementById("ajouter"))
                document.getElementById("ajouter").textContent = t.add_button || "Ajouter";

            if (document.getElementById("annuler"))
                document.getElementById("annuler").textContent = t.cancel || "Annuler";

            const lbl = document.querySelector("label");
            if (lbl)
                lbl.textContent = t.label_espece || "Espèce :";

            // Re-render select avec la langue actuelle
            renderSelect();
        })
        .catch(() => {
            // en cas d'erreur de chargement JSON, on garde le français
            especeNames = {};
            renderSelect();
        });
}

// Gestion select langue (footer)
if (document.getElementById("langue")) {
    document.getElementById("langue").value = localStorage.getItem("lang") || "fr";

    document.getElementById("langue").addEventListener("change", function () {
        localStorage.setItem("lang", document.getElementById("langue").value);
        languechoisie();
    });
}

// initial load
languechoisie();

// Ajouter espèce
document.getElementById("ajouter").addEventListener("click", function (e) {
    e.preventDefault();

    const especeId = parseInt(select.value);
    const espece = especesBase.find(e => e.id === especeId);

    let especesDB = JSON.parse(localStorage.getItem("especes")) || [];

    if (especesDB.some(e => e.id === especeId)) {
        Swal.fire({
            icon: "warning",
            title: translations.err_exists_title || "Attention",
            text: translations.err_exists || "Espèce déjà enregistrée !",
            confirmButtonColor: "#E6A117"
        });
        return;
    }

    // ✅ Recommandé: on sauvegarde id + emoji + nom
    // Le nom affiché sera traduit plus tard selon la langue.
    const newEspece = {
        id: espece.id,
        nom: espece.nom,
        emoji: espece.emoji
    };

    especesDB.push(newEspece);
    localStorage.setItem("especes", JSON.stringify(especesDB));

    Swal.fire({
        icon: "success",
        title: translations.saved_title || "Succès",
        text: translations.saved_text || "Espèce ajoutée.",
        timer: 900,
        showConfirmButton: false
    }).then(() => {
        window.location.href = "list.html";
    });
});

// Annuler
document.getElementById("annuler").addEventListener("click", function () {
    window.location.href = "list.html";
});
