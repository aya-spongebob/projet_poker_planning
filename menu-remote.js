(function () {
  const sid = localStorage.getItem("pp_sid");
  if (!sid) {
    window.location.href = "mode.html";
    return;
  }

  function safeParse(json) { try { return JSON.parse(json); } catch { return null; } }
  function ruleLabel(v) {
    return ({
      average: "Moyenne",
      median: "Médiane",
      absolute_majority: "Majorité absolue",
      relative_majority: "Majorité relative"
    })[v] || "—";
  }
  function show(el, text, type="info") {
    el.textContent = text;
    el.style.color = (type === "error") ? "#b00020" : "#0d47a1";
  }
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function normalizeBacklog(obj) {
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

  function renderPlayersInputs(count) {
    playersForm.innerHTML = "";
    for (let i = 1; i <= count; i++) {
      const div = document.createElement("div");
      div.className = "player-field";
      div.innerHTML = `
        <label for="player_${i}">Joueur ${i}</label>
        <input id="player_${i}" type="text" maxlength="20" placeholder="Pseudo du joueur ${i}">
      `;
      playersForm.appendChild(div);
    }
  }

  function collectPlayers(count) {
    const names = [];
    for (let i = 1; i <= count; i++) {
      names.push((document.getElementById(`player_${i}`)?.value || "").trim());
    }
    return names;
  }

  function validatePlayers(players) {
    if (players.some(p => !p)) return { ok:false, msg:"Veuillez remplir tous les pseudos." };
    const lower = players.map(p => p.toLowerCase());
    if (new Set(lower).size !== lower.length) return { ok:false, msg:"Les pseudos doivent être uniques." };
    return { ok:true, msg:"Joueurs enregistrés (serveur)." };
  }

  // DOM elements
  const configBadge = document.getElementById("configBadge");
  const sumProject = document.getElementById("sumProject");
  const sumPlayers = document.getElementById("sumPlayers");
  const sumSecondaryRule = document.getElementById("sumSecondaryRule");
  const secondaryLabel = document.getElementById("secondaryLabel");

  const playersForm = document.getElementById("playersForm");
  const autoFillBtn = document.getElementById("autoFillBtn");
  const savePlayersBtn = document.getElementById("savePlayersBtn");
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

  let cfg = null;

  async function init() {
    // 1) Charger config depuis serveur
    const cfgRes = await API.getConfig(sid);
    if (!cfgRes.ok) {
      window.location.href = "mode.html";
      return;
    }
    cfg = cfgRes.config;

    // 2) Vérifier mode
    if (cfg.playMode !== "remote") {
      window.location.href = "menu-router.html";
      return;
    }

    // 3) UI résumé
    configBadge.textContent = "CONFIG OK";
    configBadge.style.background = "#1976d2";

    sumProject.textContent = cfg.projectName || "Sans nom";
    sumPlayers.textContent = String(cfg.playersCount);
    sumSecondaryRule.textContent = ruleLabel(cfg.secondaryRule);
    secondaryLabel.textContent = `Tours suivants : ${ruleLabel(cfg.secondaryRule)}`;

    // 4) Champs players
    renderPlayersInputs(cfg.playersCount);

    // 5) Pré-remplir si joueurs déjà existants
    const pRes = await API.getPlayers(sid).catch(() => null);
    if (pRes && pRes.ok && Array.isArray(pRes.players)) {
      pRes.players.slice(0, cfg.playersCount).forEach((p, idx) => {
        const el = document.getElementById(`player_${idx + 1}`);
        if (el) el.value = p.name || "";
      });
    }

    // 6) Prévisualiser backlog si existe
    const bRes = await API.getBacklog(sid).catch(() => null);
    if (bRes && bRes.ok && bRes.backlog?.items) {
      renderBacklogPreview(bRes.backlog.items);
    }
  }

  autoFillBtn.addEventListener("click", () => {
    const n = cfg?.playersCount || 5;
    for (let i = 1; i <= n; i++) {
      const el = document.getElementById(`player_${i}`);
      if (el && !el.value.trim()) el.value = `Joueur${i}`;
    }
    show(playersMsg, "Pseudos remplis automatiquement.");
  });

  savePlayersBtn.addEventListener("click", async () => {
    if (!cfg) return;
    const n = cfg.playersCount;

    const names = collectPlayers(n);
    const v = validatePlayers(names);
    if (!v.ok) return show(playersMsg, v.msg, "error");

    const payload = names.map(name => ({ name }));
    const res = await API.savePlayers(sid, payload);

    if (!res.ok) return show(playersMsg, res.error || "Erreur serveur.", "error");

    // optionnel miroir local
    localStorage.setItem("pp_players", JSON.stringify(res.players));

    show(playersMsg, v.msg);
  });

  loadBacklogBtn.addEventListener("click", async () => {
    const file = backlogFile.files?.[0];
    if (!file) return show(backlogMsg, "Veuillez choisir un fichier .json.", "error");

    const text = await file.text();
    const obj = safeParse(text);
    if (!obj) return show(backlogMsg, "JSON invalide.", "error");

    const items = normalizeBacklog(obj);
    if (!items) return show(backlogMsg, "Format non reconnu (array ou {items:[...]}).", "error");

    const state = {
      cursor: 0,
      items: items.map(it => ({ ...it, status: "pending", estimation: null, rounds: [] }))
    };

    const res = await API.saveBacklog(sid, state);
    if (!res.ok) return show(backlogMsg, res.error || "Erreur serveur.", "error");

    renderBacklogPreview(res.backlog.items);
    show(backlogMsg, `Backlog chargé (${res.backlog.items.length} tâches).`);
  });

  loadResumeBtn.addEventListener("click", async () => {
    const file = resumeFile.files?.[0];
    if (!file) return show(resumeMsg, "Veuillez choisir un fichier .json.", "error");

    const text = await file.text();
    const obj = safeParse(text);
    if (!obj) return show(resumeMsg, "JSON invalide.", "error");

    // On s'attend à {cursor, items} au minimum
    if (!Array.isArray(obj.items) || typeof obj.cursor !== "number") {
      return show(resumeMsg, "Format reprise invalide (attendu {cursor, items}).", "error");
    }

    // On enregistre comme backlog côté serveur (reprise)
    const res = await API.saveBacklog(sid, { cursor: obj.cursor, items: obj.items });
    if (!res.ok) return show(resumeMsg, res.error || "Erreur serveur.", "error");

    renderBacklogPreview(res.backlog.items);
    show(resumeMsg, "Sauvegarde chargée. Reprise possible.");
  });

  startBtn.addEventListener("click", async () => {
    startError.textContent = "";

    const p = await API.getPlayers(sid).catch(() => null);
    if (!p || !p.ok || !Array.isArray(p.players) || p.players.length < 2) {
      startError.textContent = "Veuillez enregistrer les joueurs.";
      return;
    }

    const b = await API.getBacklog(sid).catch(() => null);
    if (!b || !b.ok || !Array.isArray(b.backlog?.items) || b.backlog.items.length === 0) {
      startError.textContent = "Veuillez charger un backlog (ou une sauvegarde).";
      return;
    }

    window.location.href = "poker.html";
  });

  clearAllBtn.addEventListener("click", () => {
    localStorage.removeItem("pp_sid");
    localStorage.removeItem("pp_config");
    localStorage.removeItem("pp_players");
    window.location.href = "mode.html";
  });

  init();
})();
