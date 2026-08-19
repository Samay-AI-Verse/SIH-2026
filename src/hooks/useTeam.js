import { useEffect, useState } from "react";
import { fetchTeamBundle, subscribeTable } from "../services/apiService";
import { getTeamSession } from "../lib/session";

export function useTeam(teamId) {
  const sessionId = getTeamSession().teamId;
  const id = teamId || sessionId;
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      setTeam(null);
      setLoading(false);
      return undefined;
    }
    let active = true;
    function load() {
      fetchTeamBundle(id)
        .then((result) => {
          if (active) setTeam(result);
        })
        .catch(() => {
          if (active) setTeam(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    load();
    const stop = subscribeTable("teams", load);
    return () => {
      active = false;
      stop();
    };
  }, [id]);

  return { team, loading };
}
