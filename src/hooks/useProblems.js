import { useEffect, useMemo, useState } from "react";
import { SAMPLE_PROBLEMS } from "../utils/constants";
import { fetchProblems, subscribeTable } from "../services/apiService";

export function useProblems() {
  const [problems, setProblems] = useState(SAMPLE_PROBLEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function load() {
      fetchProblems()
        .then((items) => {
          if (items?.length) setProblems(items);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }
    load();
    return subscribeTable("problems", load);
  }, []);

  const stats = useMemo(() => {
    const full = problems.filter((item) => item.status === "FULL").length;
    const locked = problems.filter((item) => item.status === "LOCKED").length;
    const available = problems.filter((item) => item.status === "AVAILABLE").length;
    return { full, locked, available, total: problems.length };
  }, [problems]);

  return { problems, loading, stats };
}
