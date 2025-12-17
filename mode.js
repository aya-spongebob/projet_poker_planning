(function () {
  const continueBtn = document.getElementById("continueBtn");
  const msg = document.getElementById("modeMsg");

  const playersCountEl = document.getElementById("playersCount");
  const projectNameEl = document.getElementById("projectName");
  const secondaryRuleEl = document.getElementById("secondaryRule");

  function show(text, type = "info") {
    msg.textContent = text;
    msg.style.color = (type === "error") ? "#b00020" : "#0d47a1";
  }

  function getSelectedPlayMode() {
    const checked = document.querySelector('input[name="playMode"]:checked');
    return checked ? checked.value : null;
  }

  continueBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const playMode = getSelectedPlayMode();
    const playersCount = Number(playersCountEl.value || 0);
    const projectName = (projectNameEl.value || "").trim();
    const secondaryRule = secondaryRuleEl.value || "median";

    if (!playMode) return show("Choisissez un mode.", "error");
    if (!Number.isFinite(playersCount) || playersCount < 2 || playersCount > 20) {
      return show("Nombre de joueurs invalide (2 à 20).", "error");
    }

    const cfg = {
      playMode,
      playersCount,
      projectName,
      secondaryRule,
      revealMode: "manual",
      moderatorName: ""
    };

    show("Sauvegarde de la configuration…");

    try {
      const result = await API.saveConfig(cfg);

      if (!result.ok) {
        show(result.error || "Erreur serveur lors de la sauvegarde.", "error");
        return;
      }

      // sid stocké pour toutes les autres pages
      localStorage.setItem("pp_sid", result.sid);

      // optionnel : garder aussi config côté front
      localStorage.setItem("pp_config", JSON.stringify(result.config));

      window.location.href = "menu-router.html";
    } catch (err) {
      show("Impossible de contacter le backend. Ouvrez via http://localhost (pas file://).", "error");
    }
  });
})();
