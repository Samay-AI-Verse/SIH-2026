const TEAM_KEY = "sih_team_id";
const REG_KEY = "sih_registration_id";

function write(store, teamId, registrationId) {
  try {
    store.setItem(TEAM_KEY, teamId);
    if (registrationId) store.setItem(REG_KEY, registrationId);
  } catch {
    // storage may be blocked
  }
}

function read(store, key) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function saveTeamSession(teamId, registrationId) {
  write(localStorage, teamId, registrationId);
  write(sessionStorage, teamId, registrationId);
}

export function getTeamSession() {
  return {
    teamId: read(localStorage, TEAM_KEY) || read(sessionStorage, TEAM_KEY),
    registrationId: read(localStorage, REG_KEY) || read(sessionStorage, REG_KEY),
  };
}
