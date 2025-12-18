(() => {
  const sid = localStorage.getItem("pp_sid");
  if (!sid) { window.location.href = "mode.html"; return; }

  const sessionLine = document.getElementById("sessionLine");
  const roundPill = document.getElementById("roundPill");
  const taskTitle = document.getElementById("taskTitle");
  const taskDesc = document.getElementById("taskDesc");
  const modeLabel = document.getElementById("modeLabel");
  const ruleLabel = document.getElementById("ruleLabel");
  const progressLabel = document.getElementById("progressLabel");
  const hintLine = document.getElementById("hintLine");
  const gameMsg = document.getElementById("gameMsg");

  const revealBtn = document.getElementById("revealBtn");
  const nextBtn = document.getElementById("nextBtn");
  const coffeeBtn = document.getElementById("coffeeBtn");

  const identityBox = document.getElementById("identityBox");
  const localBox = document.getElementById("localBox");
  const localPlayerName = document.getElementById("localPlayerName");
  const nextPlayerBtn = document.getElementById("nextPlayerBtn");

  const playerSelect = document.getElementById("playerSelect");
  const youPill = document.getElementById("youPill");

  const cardsBox = document.getElementById("cards");
  const votesBox = document.getElementById("votesBox");
  const revealPill = document.getElementById("revealPill");

  const CARD_VALUES = ["0","1","2","3","5","8","13","20","40","100","☕"];

  let cfg = null;
  let players = [];
  let backlog = null;
  let state = null;

  let localIndex = 0;

  function setMsg(text, type="info"){
    gameMsg.textContent = text || "";
    gameMsg.className = "msg" + (type==="error" ? " err" : "");
  }

  function ruleName(rule){
    return ({
      average:"Moyenne",
      median:"Médiane",
      absolute_majority:"Majorité absolue",
      relative_majority:"Majorité relative"
    })[rule] || "—";
  }

  function currentTask(){
    const idx = state?.cursor ?? 0;
    return backlog?.items?.[idx] ?? null;
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function renderCards(activeValue=null){
    cardsBox.innerHTML = "";
    for (const val of CARD_VALUES){
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cardbtn" + (val==="☕" ? " coffee" : "") + (activeValue===val ? " active" : "");
      btn.textContent = val;
      btn.addEventListener("click", () => onPickCard(val));
      cardsBox.appendChild(btn);
    }
  }

  function renderVotes(){
    const revealed = !!state?.revealed;
    revealPill.textContent = revealed ? "Révélés" : "Cachés";

    const voteMap = state?.votes || {};
    votesBox.innerHTML = "";

    if (!players.length){
      votesBox.innerHTML = `<div class="empty">Aucun joueur.</div>`;
      return;
    }

    let any = false;
    for (const p of players){
      const v = voteMap[String(p.id)] ?? null;
      const item = document.createElement("div");
      item.className = "voteitem";
      item.innerHTML = `
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="val">${revealed ? (v ?? "—") : (v ? "✔" : "—")}</div>
      `;
      votesBox.appendChild(item);
      if (v) any = true;
    }
    if (!any) votesBox.innerHTML = `<div class="empty">En attente de votes…</div>`;
  }

  function renderUI(){
    const task = currentTask();
    if (!task){
      taskTitle.textContent = "Backlog terminé ✅";
      taskDesc.textContent = "Vous pouvez exporter les résultats (Suivant).";
      hintLine.textContent = "Cliquez sur Suivant pour exporter.";
      roundPill.textContent = "FIN";
      progressLabel.textContent = `${backlog.items.length}/${backlog.items.length}`;
      revealBtn.disabled = true;
      renderVotes();
      return;
    }

    taskTitle.textContent = task.title;
    taskDesc.textContent = task.description || "";
    roundPill.textContent = `Round ${state.round}`;
    progressLabel.textContent = `${state.cursor+1}/${backlog.items.length}`;

    hintLine.textContent = (state.round === 1)
      ? "Round 1 : unanimité obligatoire."
      : `Round ${state.round} : règle secondaire = ${ruleName(cfg.secondaryRule)}.`;

    renderVotes();
    revealBtn.disabled = false;
  }

  function getActivePlayerId(){
    if (cfg.playMode === "remote"){
      return sessionStorage.getItem("pp_pid") || playerSelect.value;
    }
    return String(players[localIndex]?.id || "");
  }

  function syncIdentityUI(){
    if (cfg.playMode === "remote"){
      identityBox.style.display = "";
      localBox.style.display = "none";

      playerSelect.innerHTML = "";
      for (const p of players){
        const opt = document.createElement("option");
        opt.value = String(p.id);
        opt.textContent = p.name;
        playerSelect.appendChild(opt);
      }

      const savedPid = sessionStorage.getItem("pp_pid");
      if (savedPid && players.some(p => String(p.id)===savedPid)){
        playerSelect.value = savedPid;
      } else {
        sessionStorage.setItem("pp_pid", playerSelect.value);
      }

      youPill.textContent = `Vous : ${players.find(p=>String(p.id)===playerSelect.value)?.name || "—"}`;

      playerSelect.addEventListener("change", ()=>{
        sessionStorage.setItem("pp_pid", playerSelect.value);
        youPill.textContent = `Vous : ${players.find(p=>String(p.id)===playerSelect.value)?.name || "—"}`;
        renderCards(null);
      });

    } else {
      identityBox.style.display = "none";
      localBox.style.display = "";

      localIndex = 0;
      localPlayerName.textContent = players[0]?.name || "—";
      youPill.textContent = `Tour : ${players[0]?.name || "—"}`;
    }
  }

  async function loadAll(){
    sessionLine.textContent = `Session : ${sid}`;

    await fetch(`api/game-state-init.php?sid=${encodeURIComponent(sid)}`)
      .then(r=>r.json()).catch(()=>null);

    const cfgRes = await fetch(`api/config_get.php?sid=${encodeURIComponent(sid)}`).then(r=>r.json());
    if (!cfgRes.ok) { window.location.href="mode.html"; return; }
    cfg = cfgRes.config;

    const pRes = await fetch(`api/players_get.php?sid=${encodeURIComponent(sid)}`).then(r=>r.json());
    if (!pRes.ok) { window.location.href="menu-router.html"; return; }
    players = pRes.players || [];

    const bRes = await fetch(`api/backlog_get.php?sid=${encodeURIComponent(sid)}`).then(r=>r.json());
    if (!bRes.ok) { window.location.href="menu-router.html"; return; }
    backlog = bRes.backlog;

    const sRes = await fetch(`api/game-state-get.php?sid=${encodeURIComponent(sid)}`).then(r=>r.json());
    if (!sRes.ok) { setMsg("Impossible de charger l'état de la partie.","error"); return; }
    state = sRes.state;

    modeLabel.textContent = (cfg.playMode === "remote") ? "À distance" : "Local";
    ruleLabel.textContent = ruleName(cfg.secondaryRule);

    syncIdentityUI();
    renderCards(null);
    renderUI();
  }

  async function onPickCard(val){
    const pid = getActivePlayerId();
    if (!pid){ setMsg("Aucun joueur sélectionné.","error"); return; }

    renderCards(val);

    const res = await fetch(`api/vote-submit.php?sid=${encodeURIComponent(sid)}`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ playerId: pid, value: val })
    }).then(r=>r.json()).catch(()=>null);

    if (!res || !res.ok){
      setMsg(res?.error || "Vote non enregistré (backend).","error");
      return;
    }
    state = res.state;
    setMsg(`Vote enregistré : ${val}`);
    renderUI();
  }

  nextPlayerBtn?.addEventListener("click", ()=>{
    if (cfg.playMode !== "local") return;
    localIndex = (localIndex + 1) % players.length;
    localPlayerName.textContent = players[localIndex]?.name || "—";
    youPill.textContent = `Tour : ${players[localIndex]?.name || "—"}`;
    renderCards(null);
    setMsg("");
  });

  revealBtn.addEventListener("click", async ()=>{
    const res = await fetch(`api/reveal.php?sid=${encodeURIComponent(sid)}`, { method:"POST" })
      .then(r=>r.json()).catch(()=>null);
    if (!res || !res.ok){ setMsg(res?.error || "Impossible de révéler.","error"); return; }
    state = res.state;
    renderUI();
  });

  nextBtn.addEventListener("click", async ()=>{
    setMsg("");

    if (!currentTask()){
      window.location.href = `api/export.php?sid=${encodeURIComponent(sid)}`;
      return;
    }

    const res = await fetch(`api/next-step.php?sid=${encodeURIComponent(sid)}`, { method:"POST" })
      .then(r=>r.json()).catch(()=>null);

    if (!res || !res.ok){
      setMsg(res?.error || "Impossible d'avancer.","error");
      return;
    }

    if (res.message) setMsg(res.message);
    state = res.state;

    renderCards(null);

    if (cfg.playMode === "local"){
      localIndex = 0;
      localPlayerName.textContent = players[0]?.name || "—";
      youPill.textContent = `Tour : ${players[0]?.name || "—"}`;
    }

    renderUI();
  });

  coffeeBtn.addEventListener("click", async ()=>{
    localStorage.setItem("frontendagile:returnToVote", window.location.href);

    const res = await fetch(`api/coffee.php?sid=${encodeURIComponent(sid)}`, { method:"POST" })
      .then(r=>r.json()).catch(()=>null);

    if (!res || !res.ok){
      setMsg(res?.error || "Sauvegarde café impossible.","error");
      return;
    }

    window.location.href = "cafe.html";
  });

  setInterval(async ()=>{
    if (!cfg || cfg.playMode !== "remote") return;
    const sRes = await fetch(`api/game-state-get.php?sid=${encodeURIComponent(sid)}`)
      .then(r=>r.json()).catch(()=>null);
    if (sRes && sRes.ok){
      state = sRes.state;
      renderUI();
    }
  }, 900);

  loadAll();
})();
