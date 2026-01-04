
//===============================================
let translations = {};
function testauth() {
  const adminmail = "admin@app.com";
  const adminmdp = "admin@123";

  const mail = document.getElementById("email").value.trim().toLowerCase();
  const mdp = document.getElementById("password").value.trim();

  // champs vides
  if (!mail || !mdp) {
    Swal.fire({
      icon: "warning",
      title: translations.warning_title || "Attention",
      text: translations.warning_text || "Veuillez remplir tous les champs.",
      timer: 1200,
      confirmButtonColor: "#E6A117"
    });
    return;
  }

  // ADMIN
  if (mail === adminmail && mdp === adminmdp) {
    localStorage.setItem("sessionUser", JSON.stringify({
      id: 1,
      email: mail,
      role: "admin"
    }));
    window.location.href = "pages/dashboard.html";
    return;
  }

  // ✅ CLIENT (localStorage comptes)
  const comptes = JSON.parse(localStorage.getItem("comptes") || "[]");
  const client = comptes.find(c => c.email.toLowerCase() === mail && c.mdp === mdp);

  if (client) {
    localStorage.setItem("sessionUser", JSON.stringify({
      id: client.id,
      email: client.email,
      nom: client.nom || client.email.split("@")[0],
      role: "client"
    }));
    window.location.href = "pages/compte/client.html";
    return;
  }

  Swal.fire({
    icon: "error",
    title: translations.error_title || "Erreur",
    text: translations.error_text || "Email ou mot de passe incorrect.",
    timer: 1200,
    confirmButtonColor: "#1C8EB3"
  });
  //on remet le mdp à vide pour des raisons de sécurité
  document.getElementById("password").value = "";
}

function languechoisie() {
  let langue = document.getElementById("langue").value;
  fetch("languages/" + langue + ".json")
    .then(r => r.json())
    .then(data => {
      let t = data.index || {};
      translations = t;

      document.getElementById("titre").innerText = t.titre || "Pet Manager";
      document.getElementById("title").innerText = t.title || "Pet Manager";
      document.getElementById("subtitle").innerText = t.subtitle || "";
      document.getElementById("label-email").innerText = t.email || "Email";
      document.getElementById("label-password").innerText = t.password || "Mot de passe";
      document.getElementById("btn-login").innerText = t.login || "Se connecter";

      document.body.style.direction = (langue === "ar") ? "rtl" : "ltr";
      localStorage.setItem("lang", langue);
    });
}

document.getElementById("btn-login").addEventListener("click", testauth);
document.getElementById("langue").addEventListener("change", languechoisie);

let saved = localStorage.getItem("lang") || "fr";
document.getElementById("langue").value = saved;
languechoisie();
