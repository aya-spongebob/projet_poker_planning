(function () {
  const sid = localStorage.getItem("pp_sid");
  if (!sid) { window.location.href = "mode.html"; return; }

  function safeParse(json) { try { return JSON.parse(json); } catch { return null; } }
  function ruleLabel(v){ return ({average:"Moyenne",median:"Médiane",absolute_majority:"Majorité absolue",relative_majority:"Majorité relative"})[v]||"—"; }
  function show(el, text, type="info"){ el.textContent=text; el.style.color=(type==="error")?"#b00020":"#0d47a1"; }

  const configBadge = document.getElementById("configBadge");
  const sumProject = document.getElementById("sumProject");
  const sumPlayers = document.getElementById("sumPlayers");
  const sumSecondaryRule = document.getElementById("sumSecondaryRule");
  const secondaryLabel = document.getElementById("secondaryLabel");

  const moderatorName = document.getElementById("moderatorName");
  const revealMode = document.getElementById("revealMode");
  const saveLocalOptionsBtn = document.getElementById("saveLocalOptionsBtn");
  const localMsg = document.getElementById("localMsg");

  const playersForm = document.getElementById("playersForm");
  const autoFillBtn = document.getElementById("autoFillBtn");
  const savePlayersBtn = document.getElementById("savePlayersBtn");
  const playersMsg = document.getElementById("playersMsg");

  const backlogFile = document.getElementById("backlogFile");
  const loadBacklogBtn = document.getElementById("loadBacklogBtn");
  const backlogMsg = document.getElementById("backlogMsg");
  const backlogPreview = document.getElementById("backlogPreview");
  const backlogCount = document.getElementById("backlogCount");

  const startBtn = document.getElementById("startBtn");
  const startError = document.getElementById("startError");

  const clearAllBtn = document.getElementById("clearAllBtn");

  function renderPlayersInputs(count) {
    playersForm.innerHTML = "";
    for (let i=1;i<=count;i++){
      const div=document.createElement("div");
      div.className="player-field";
      div.innerHTML = `
        <label for="player_${i}">Joueur ${i}</label>
        <input id="player_${i}" type="text" maxlength="20" placeholder="Pseudo du joueur ${i}">
      `;
      playersForm.appendChild(div);
    }
  }

  function collectPlayers(count){
    const arr=[];
    for (let i=1;i<=count;i++){
      arr.push((document.getElementById(`player_${i}`)?.value||"").trim());
    }
    return arr;
  }

  function validatePlayers(players){
    if (players.some(p=>!p)) return {ok:false,msg:"Remplissez tous les pseudos."};
    const lower=players.map(p=>p.toLowerCase());
    if (new Set(lower).size!==lower.length) return {ok:false,msg:"Pseudos dupliqués."};
    return {ok:true,msg:"Joueurs enregistrés (serveur)."};
  }

  function escapeHtml(str){
    return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  function normalizeBacklog(obj){
    if (Array.isArray(obj)){
      return obj.map((it,i)=>({id:it.id??(i+1),title:it.title??it.name??`Tâche ${i+1}`,description:it.description??it.desc??""}));
    }
    if (obj && Array.isArray(obj.items)){
      return obj.items.map((it,i)=>({id:it.id??(i+1),title:it.title??it.name??`Tâche ${i+1}`,description:it.description??it.desc??""}));
    }
    return null;
  }

  function renderBacklogPreview(items){
    backlogPreview.innerHTML="";
    if (!items || items.length===0){
      backlogPreview.innerHTML=`<div class="empty">Aucun backlog chargé.</div>`;
      backlogCount.textContent="0 tâches";
      return;
    }
    backlogCount.textContent=`${items.length} tâches`;
    items.slice(0,8).forEach(it=>{
      const div=document.createElement("div");
      div.className="task";
      div.innerHTML=`<div class="t">${escapeHtml(it.title)}</div><div class="d">${escapeHtml(it.description||"")}</div>`;
      backlogPreview.appendChild(div);
    });
  }

  async function init(){
    const cfgRes = await API.getConfig(sid);
    if (!cfgRes.ok) { window.location.href="mode.html"; return; }
    const cfg = cfgRes.config;

    if (cfg.playMode !== "local") { window.location.href="menu-router.html"; return; }

    configBadge.textContent="CONFIG OK";
    configBadge.style.background="#1976d2";
    sumProject.textContent=cfg.projectName || "Sans nom";
    sumPlayers.textContent=String(cfg.playersCount);
    sumSecondaryRule.textContent=ruleLabel(cfg.secondaryRule);
    secondaryLabel.textContent=`Tours suivants : ${ruleLabel(cfg.secondaryRule)}`;

    moderatorName.value = cfg.moderatorName || "";
    revealMode.value = cfg.revealMode || "manual";

    renderPlayersInputs(cfg.playersCount);

    // Preview backlog si déjà enregistré
    const blRes = await API.getBacklog(sid).catch(()=>null);
    if (blRes && blRes.ok) renderBacklogPreview(blRes.backlog.items);
  }

  saveLocalOptionsBtn.addEventListener("click", async ()=>{
    // on resauve la config complète côté serveur
    const cfgLocal = safeParse(localStorage.getItem("pp_config")||"null") || {};
    cfgLocal.moderatorName = (moderatorName.value||"").trim();
    cfgLocal.revealMode = revealMode.value || "manual";

    // pour être sûr : récupérer config serveur et re-poster
    const cfgRes = await API.getConfig(sid);
    if (!cfgRes.ok) return show(localMsg,"Config serveur introuvable.","error");

    const merged = { ...cfgRes.config, ...cfgLocal };
    const save = await API.saveConfig(merged);
    if (!save.ok) return show(localMsg, save.error || "Erreur serveur.", "error");

    localStorage.setItem("pp_config", JSON.stringify(save.config));
    show(localMsg,"Options local enregistrées (serveur).");
  });

  autoFillBtn.addEventListener("click", async ()=>{
    const cfgRes = await API.getConfig(sid);
    if (!cfgRes.ok) return;
    const n = cfgRes.config.playersCount;
    for (let i=1;i<=n;i++){
      const el=document.getElementById(`player_${i}`);
      if (el && !el.value.trim()) el.value=`Joueur${i}`;
    }
    show(playersMsg,"Pseudos auto remplis.");
  });

  savePlayersBtn.addEventListener("click", async ()=>{
    const cfgRes = await API.getConfig(sid);
    if (!cfgRes.ok) return show(playersMsg,"Config serveur introuvable.","error");
    const n = cfgRes.config.playersCount;

    const names = collectPlayers(n);
    const v = validatePlayers(names);
    if (!v.ok) return show(playersMsg, v.msg, "error");

    const payload = names.map(name=>({name}));
    const res = await API.savePlayers(sid, payload);
    if (!res.ok) return show(playersMsg, res.error || "Erreur serveur.", "error");

    // Optionnel : stockage local miroir
    localStorage.setItem("pp_players", JSON.stringify(res.players));

    show(playersMsg, v.msg);
  });

  loadBacklogBtn.addEventListener("click", async ()=>{
    const file = backlogFile.files?.[0];
    if (!file) return show(backlogMsg,"Choisissez un fichier JSON.","error");

    const text = await file.text();
    const obj = safeParse(text);
    if (!obj) return show(backlogMsg,"JSON invalide.","error");

    const items = normalizeBacklog(obj);
    if (!items) return show(backlogMsg,"Format non reconnu.","error");

    const state = {
      cursor: 0,
      items: items.map(it=>({ ...it, status:"pending", estimation:null, rounds:[] }))
    };

    const res = await API.saveBacklog(sid, state);
    if (!res.ok) return show(backlogMsg, res.error || "Erreur serveur.", "error");

    renderBacklogPreview(res.backlog.items);
    show(backlogMsg, `Backlog chargé (${res.backlog.items.length}).`);
  });

  startBtn.addEventListener("click", async ()=>{
    startError.textContent="";

    const p = await API.getPlayers(sid).catch(()=>null);
    if (!p || !p.ok) { startError.textContent="Enregistrez les joueurs."; return; }

    const b = await API.getBacklog(sid).catch(()=>null);
    if (!b || !b.ok || !b.backlog.items?.length) { startError.textContent="Chargez un backlog."; return; }

    window.location.href = "poker.html";
  });

  clearAllBtn.addEventListener("click", ()=>{
    localStorage.removeItem("pp_sid");
    localStorage.removeItem("pp_config");
    localStorage.removeItem("pp_players");
    window.location.href="mode.html";
  });

  init();
})();
