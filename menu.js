(function () {
  // Elements
  const sumProject = document.getElementById("sumProject");
  const sumPlayMode = document.getElementById("sumPlayMode");
  const sumPlayers = document.getElementById("sumPlayers");
  const sumSecondaryRule = document.getElementById("sumSecondaryRule");
  const configBadge = document.getElementById("configBadge");

  const playersForm = document.getElementById("playersForm");
  const savePlayersBtn = document.getElementById("savePlayersBtn");
  const autoFillBtn = document.getElementById("autoFillBtn");
  const playersMsg = document.getElementById("playersMsg");

  const backlogFile = document.getElementById("backlogFile");
  const loadBacklogBtn = document.getElementById("loadBacklogBtn");
  const backlogMsg = document.getElementById("backlogMsg");
  const backlogPreview = document.getElementById("backlogPreview");
  const backlogCount = document.getElementById("backlogCount");

  const resumeFile = document.getElementById("resumeFile");
  const loadResumeBtn = document.getElementById("loadResumeBtn");
  const resumeMsg = document.getElementById("resumeMsg");

  const startBtn = document.getElementById("startBtn");
  const startError = document.getElementById("startError");

  const clearAllBtn = document.getElementById("clearAllBtn");

  function safeParse(json) {
    try { return JSON.parse(json); } catch { return null; }
  }

  function ruleLabel(value) {
    const map = {
      average: "Moyenne",
      median: "Médiane",
      absolute_majority: "Majorité absolue",
      relative_majority: "Majorité relative"
    };
    return map[value] || "—";
  }

  function modeLabel(value) {
    return value === "remote" ? "À distance" : value === "local" ? "Locale" : "—";
  }

  function readConfig() {
    const cfg = safeParse(localStorage.getItem("pp_config") || "");
    return cfg;
  }

  function renderSummary(cfg) {
    if (!cfg) {
      configBadge.textContent = "CONFIG MANQUANTE";
      configBadge.style.background = "#b00020";
      sumProject.textContent = "—";
      sumPlayMode.textContent = "—";
      sumPlayers.textContent = "—";
      sumSecondaryRule.textContent = "—";
      return;
    }

    configBadge.textContent = "CONFIG OK";
    configBadge.style.background = "#1976d2";

    sumProject.textContent = cfg.projectName ? cfg.projectName : "Sans nom";
    sumPlayMode.textContent = modeLabel(cfg.playMode);
    sumPlayers.textContent = String(cfg.playersCount || "—");
    sumSecondaryRule.textContent = ruleLabel(cfg.secondaryRule);
  }

  function renderPlayersInputs(count) {
    playersForm.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const div = document.createElement("div");
      div.className = "player-field";

      const label = document.createElement("label");
      label.textContent = `Joueur ${i}`;
      label.setAttribute("for", `player_${i}`);

      const input = document.createElement("input");
      input.type = "text";
      input.id = `player_${i}`;
      input.placeholder = `Pseudo du joueur ${i}`;
      input.autocomplete = "off";
      input.maxLength = 20;

      div.appendChild(label);
      div.appendChild(input);
      playersForm.appendChild(div);
    }

    // try load existing
    const saved = safeParse(localStorage.getItem("pp_players") || "");
    if (saved && Array.isArray(saved)) {
      saved.slice(0, count).forEach((p, idx) => {
        const el = document.getElementById(`player_${idx + 1}`);
        if (el) el.value = p.name || "";
      });
    }
  }

  function collectPlayers(count) {
    const players = [];
    for (let i = 1; i <= count; i++) {
      const v = (document.getElementById(`player_${i}`)?.value || "").trim();
      players.push(v);
    }
    return players;
  }

  function validatePlayers(players) {
    const cleaned = players.map(p => p.trim()).filter(Boolean);

    if (cleaned.length !== players.length) {
      return { ok: false, msg: "Veuillez remplir tous les pseudos (aucun champ vide)." };
    }

    const lower = cleaned.map(p => p.toLowerCase());
    const unique = new Set(lower);
    if (unique.size !== lower.length) {
      return { ok: false, msg: "Les pseudos doivent être uniques (pas de doublons)." };
    }

    return { ok: true, msg: "Joueurs enregistrés." };
  }

  function savePlayers(players) {
    const data = players.map((name, idx) => ({
      id: idx + 1,
      name
    }));
    localStorage.setItem("pp_players", JSON.stringify(data));
  }

  function showMsg(el, text, type = "info") {
    el.textContent = text;
    el.style.color = (type === "error") ? "#b00020" : "#0d47a1";
  }

  async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
      reader.readAsText(file);
    });
  }

  function normalizeBacklog(obj) {
    // Accept either {items:[...]} or direct array [...]
    if (Array.isArray(obj)) {
      return obj.map((it, i) => ({
        id: it.id ?? (i + 1),
        title: it.title ?? it.name ?? `Tâche ${i + 1}`,
        description: it.description ?? it.desc ?? ""
      }));
    }

    if (obj && Array.isArray(obj.items)) {
      return obj.items.map((it, i) => ({
        id: it.id ?? (i + 1),
        title: it.title ?? it.name ?? `Tâche ${i + 1}`,
        description: it.description ?? it.desc ?? ""
      }));
    }

    return null;
  }

  function renderBacklogPreview(items) {
    backlogPreview.innerHTML = "";

    if (!items || items.length === 0) {
      backlogPreview.innerHTML = `<div class="empty">Aucun backlog chargé.</div>`;
      backlogCount.textContent = "0 tâches";
      return;
    }

    backlogCount.textContent = `${items.length} tâches`;

    items.slice(0, 8).forEach((it) => {
      const div = document.createElement("div");
      div.className = "task";
      div.innerHTML = `
        <div class="t">${escapeHtml(it.title)}</div>
        <div class="d">${escapeHtml(it.description || "")}</div>
      `;
      backlogPreview.appendChild(div);
    });

    if (items.length > 8) {
      const more = document.createElement("div");
      more.className = "empty";
      more.textContent = `… +${items.length - 8} autres tâches`;
      backlogPreview.appendChild(more);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function loadBacklog() {
    const file = backlogFile.files?.[0];
    if (!file) {
      showMsg(backlogMsg, "Veuillez choisir un fichier .json.", "error");
      return;
    }

    const text = await readFileAsText(file);
    const obj = safeParse(text);
    if (!obj) {
      showMsg(backlogMsg, "JSON invalide. Vérifiez la syntaxe.", "error");
      return;
    }

    const items = normalizeBacklog(obj);
    if (!items) {
      showMsg(backlogMsg, "Format non reconnu. Utilisez un tableau ou { items: [...] }.", "error");
      return;
    }

    // Save normalized backlog + progress status
    const state = {
      loadedAt: new Date().toISOString(),
      cursor: 0,             // index de la tâche courante
      items: items.map(it => ({
        ...it,
        status: "pending",   // pending | validated
        estimation: null,    // valeur finale
        rounds: []           // historique des tours
      }))
    };

    localStorage.setItem("pp_backlog", JSON.stringify(state));
    renderBacklogPreview(state.items);
    showMsg(backlogMsg, `Backlog chargé (${state.items.length} tâches).`, "info");
  }

  async function loadResume() {
    const file = resumeFile.files?.[0];
    if (!file) {
      showMsg(resumeMsg, "Veuillez choisir un fichier .json de reprise.", "error");
      return;
    }

    const text = await readFileAsText(file);
    const obj = safeParse(text);
    if (!obj) {
      showMsg(resumeMsg, "JSON invalide. Vérifiez la syntaxe.", "error");
      return;
    }

    // Minimal expected: { cursor, items:[...] }
    if (!obj.items || !Array.isArray(obj.items) || typeof obj.cursor !== "number") {
      showMsg(resumeMsg, "Format de reprise non reconnu (attendu: { cursor, items: [...] }).", "error");
      return;
    }

    localStorage.setItem("pp_backlog", JSON.stringify(obj));
    localStorage.setItem("pp_resume", "1");

    renderBacklogPreview(obj.items);
    showMsg(resumeMsg, "Sauvegarde chargée. Vous pouvez reprendre la partie.", "info");
  }

  function hasPlayers() {
    const saved = safeParse(localStorage.getItem("pp_players") || "");
    return saved && Array.isArray(saved) && saved.length > 0 && saved.every(p => p.name);
  }

  function hasBacklog() {
    const saved = safeParse(localStorage.getItem("pp_backlog") || "");
    return saved && Array.isArray(saved.items) && saved.items.length > 0;
  }

  function startGame() {
    startError.textContent = "";

    if (!readConfig()) {
      startError.textContent = "Configuration introuvable. Retournez à la page Mode de jeu.";
      return;
    }
    if (!hasPlayers()) {
      startError.textContent = "Veuillez enregistrer les pseudos des joueurs.";
      return;
    }
    if (!hasBacklog()) {
      startError.textContent = "Veuillez charger un backlog JSON (ou une sauvegarde).";
      return;
    }

    // go to game page
    window.location.href = "poker.html";
  }

  function clearAll() {
    // wipe only our keys
    localStorage.removeItem("pp_players");
    localStorage.removeItem("pp_backlog");
    localStorage.removeItem("pp_resume");

    showMsg(playersMsg, "Données joueurs effacées.", "info");
    showMsg(backlogMsg, "Backlog effacé.", "info");
    showMsg(resumeMsg, "Reprise effacée.", "info");
    renderBacklogPreview([]);
  }

  function autoFillPlayers(count) {
    for (let i = 1; i <= count; i++) {
      const el = document.getElementById(`player_${i}`);
      if (el && !el.value.trim()) el.value = `Joueur${i}`;
    }
  }

  // INIT
  const cfg = readConfig();
  renderSummary(cfg);

  const n = cfg?.playersCount || 5;
  renderPlayersInputs(n);

  // Load backlog preview if already saved
  const savedBacklog = safeParse(localStorage.getItem("pp_backlog") || "");
  if (savedBacklog && savedBacklog.items) renderBacklogPreview(savedBacklog.items);

  // Events
  savePlayersBtn.addEventListener("click", () => {
    const players = collectPlayers(n);
    const v = validatePlayers(players);
    if (!v.ok) {
      showMsg(playersMsg, v.msg, "error");
      return;
    }
    savePlayers(players);
    showMsg(playersMsg, v.msg, "info");
  });

  autoFillBtn.addEventListener("click", () => {
    autoFillPlayers(n);
    showMsg(playersMsg, "Pseudos remplis automatiquement.", "info");
  });

  loadBacklogBtn.addEventListener("click", () => {
    loadBacklog().catch(() => showMsg(backlogMsg, "Erreur lors du chargement du backlog.", "error"));
  });

  loadResumeBtn.addEventListener("click", () => {
    loadResume().catch(() => showMsg(resumeMsg, "Erreur lors du chargement de la sauvegarde.", "error"));
  });

  startBtn.addEventListener("click", startGame);
  clearAllBtn.addEventListener("click", clearAll);
})();
