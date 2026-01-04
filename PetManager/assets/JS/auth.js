const DB_KEY = "db";
const SESSION_KEY = "sessionUser"; 

function showPage() {
  document.body.style.visibility = "visible";
}

function getDB() {
  return JSON.parse(localStorage.getItem(DB_KEY) || "{}");
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function setSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: user.id, email: user.email, role: user.role })
  );
}

function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

function logoutToIndex() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "../../index.html";
}

function requireAuth() {
  showPage();

  const u = getSession();
  if (!u) {
    window.location.href = "../../index.html";
    return null;
  }
  return u;
}

function isAdmin() {
  const u = getSession();
  return u && u.role === "admin";
}

document.addEventListener("DOMContentLoaded", showPage);
