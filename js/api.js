// js/api.js
const API = {
  saveConfig: async (cfg) => {
    const res = await fetch("api/config_save.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg)
    });
    return res.json();
  },

  getConfig: async (sid) => {
    const res = await fetch(`api/config_get.php?sid=${encodeURIComponent(sid)}`);
    return res.json();
  },

  savePlayers: async (sid, players) => {
    const res = await fetch(`api/players_save.php?sid=${encodeURIComponent(sid)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players })
    });
    return res.json();
  },

  getPlayers: async (sid) => {
    const res = await fetch(`api/players_get.php?sid=${encodeURIComponent(sid)}`);
    return res.json();
  },

  saveBacklog: async (sid, backlog) => {
    const res = await fetch(`api/backlog_save.php?sid=${encodeURIComponent(sid)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backlog)
    });
    return res.json();
  },

  getBacklog: async (sid) => {
    const res = await fetch(`api/backlog_get.php?sid=${encodeURIComponent(sid)}`);
    return res.json();
  },

  saveResume: async (sid, resume) => {
    const res = await fetch(`api/resume_save.php?sid=${encodeURIComponent(sid)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resume)
    });
    return res.json();
  },

  getResume: async (sid) => {
    const res = await fetch(`api/resume_get.php?sid=${encodeURIComponent(sid)}`);
    return res.json();
  }
};
