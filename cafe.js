const KEY_CAFE = "frontendagile:cafe";
const KEY_RETURN = "frontendagile:returnToVote";

const $ = (id) => document.getElementById(id);

function load() {
  const raw = localStorage.getItem(KEY_CAFE);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    $("topic").value = data.topic || "";
    $("notes").value = data.notes || "";
    $("status").textContent = data.updatedAt ? "Dernière sauvegarde : " + data.updatedAt : "";
  } catch {}
}

function save() {
  const data = {
    topic: $("topic").value.trim(),
    notes: $("notes").value.trim(),
    updatedAt: new Date().toLocaleString("fr-FR")
  };
  localStorage.setItem(KEY_CAFE, JSON.stringify(data));
  $("status").textContent = "Sauvegardé (" + data.updatedAt + ")";
}

function clearAll() {
  localStorage.removeItem(KEY_CAFE);
  $("topic").value = "";
  $("notes").value = "";
  $("status").textContent = "Effacé.";
}

function backToVote() {
  const url = localStorage.getItem(KEY_RETURN);
  window.location.href = url || "menu.html";
}

window.addEventListener("DOMContentLoaded", () => {
  load();
  $("save").addEventListener("click", save);
  $("clear").addEventListener("click", clearAll);
  $("backVote").addEventListener("click", backToVote);
});
