(function () {
  const form = document.getElementById("modeForm");
  const errorBox = document.getElementById("formError");

  const playersCount = document.getElementById("playersCount");
  const projectName = document.getElementById("projectName");
  const secondaryRule = document.getElementById("secondaryRule");

  const uncertainty = document.getElementById("uncertainty");
  const urgency = document.getElementById("urgency");
  const teamSize = document.getElementById("teamSize");
  const needConsensus = document.getElementById("needConsensus");

  const recommendationText = document.getElementById("recommendationText");

  function getPlayMode() {
    const checked = document.querySelector('input[name="playMode"]:checked');
    return checked ? checked.value : null;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function computeRecommendation() {
    // Logique simple + lisible (tu peux l’affiner)
    const u = uncertainty.value;     // low/medium/high
    const ur = urgency.value;        // low/medium/high
    const ts = teamSize.value;       // small/medium/large
    const c = needConsensus.value;   // low/medium/high

    // Heuristique
    let rec = "Médiane";
    let why = "robuste aux valeurs extrêmes et utile quand il y a des écarts.";

    if (c === "high") {
      rec = "Majorité absolue";
      why = "favorise une décision plus “forte” après discussion.";
    }

    if (u === "high") {
      rec = "Médiane";
      why = "protège contre un ou deux votes très hauts/bas lorsque l’incertitude est forte.";
    }

    if (ts === "large" && ur === "high") {
      rec = "Majorité relative";
      why = "rapide et pratique pour équipes nombreuses sous contrainte de temps.";
    }

    if (u === "low" && c !== "high") {
      rec = "Moyenne";
      why = "souvent pertinente quand les écarts sont faibles et les tâches bien comprises.";
    }

    recommendationText.textContent = `${rec} — ${why}`;
  }

  function loadSavedConfig() {
    try {
      const saved = localStorage.getItem("pp_config");
      if (!saved) return;

      const cfg = JSON.parse(saved);

      // playMode
      if (cfg.playMode) {
        const radio = document.querySelector(`input[name="playMode"][value="${cfg.playMode}"]`);
        if (radio) radio.checked = true;
      }

      // players & project
      if (typeof cfg.playersCount === "number") {
        playersCount.value = clamp(cfg.playersCount, 2, 20);
      }
      if (typeof cfg.projectName === "string") {
        projectName.value = cfg.projectName;
      }

      // rules
      if (cfg.secondaryRule) {
        secondaryRule.value = cfg.secondaryRule;
      }

      // criteria
      if (cfg.criteria) {
        if (cfg.criteria.uncertainty) uncertainty.value = cfg.criteria.uncertainty;
        if (cfg.criteria.urgency) urgency.value = cfg.criteria.urgency;
        if (cfg.criteria.teamSize) teamSize.value = cfg.criteria.teamSize;
        if (cfg.criteria.needConsensus) needConsensus.value = cfg.criteria.needConsensus;
      }
    } catch (e) {
      // si JSON corrompu, on ignore
    }
  }

  function validate() {
    errorBox.textContent = "";

    const mode = getPlayMode();
    if (!mode) {
      errorBox.textContent = "Veuillez choisir un type de partie (à distance ou locale).";
      return false;
    }

    const n = Number(playersCount.value);
    if (!Number.isFinite(n) || n < 2 || n > 20) {
      errorBox.textContent = "Le nombre de joueurs doit être compris entre 2 et 20.";
      return false;
    }

    if (!secondaryRule.value) {
      errorBox.textContent = "Veuillez choisir une règle secondaire.";
      return false;
    }

    return true;
  }

  function saveConfig() {
    const cfg = {
      projectName: (projectName.value || "").trim(),
      playMode: getPlayMode(),                 // remote | local
      playersCount: Number(playersCount.value),
      primaryRule: "strict_unanimity",         // imposé
      secondaryRule: secondaryRule.value,      // average | median | absolute_majority | relative_majority
      criteria: {
        uncertainty: uncertainty.value,
        urgency: urgency.value,
        teamSize: teamSize.value,
        needConsensus: needConsensus.value
      },
      savedAt: new Date().toISOString()
    };

    localStorage.setItem("pp_config", JSON.stringify(cfg));
    return cfg;
  }

  // Events
  [uncertainty, urgency, teamSize, needConsensus].forEach(el => {
    el.addEventListener("change", computeRecommendation);
  });

  secondaryRule.addEventListener("change", () => {
    // optionnel: pourrait refléter la sélection dans la recommandation, mais on laisse simple
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    saveConfig();

    // Redirection : change ici vers ta page suivante (menu joueurs / backlog / partie)
    window.location.href = "menu.html";
  });

  // Init
  loadSavedConfig();
  computeRecommendation();
})();
