import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "../utils/constants";
import { fetchSettings, subscribeTable } from "../services/apiService";

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function load() {
      fetchSettings()
        .then((row) => {
          if (row) {
            setSettings({
              fee: Number(row.fee ?? 300),
              currency: row.currency || "INR",
              isActive: row.is_active !== false && row.is_active !== 0,
              minMembers: Number(row.min_members ?? 6),
              maxMembers: Number(row.max_members ?? 6),
            });
          }
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }
    load();
    return subscribeTable("settings", load);
  }, []);

  return { settings, loading };
}
