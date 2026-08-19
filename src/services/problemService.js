import { SAMPLE_PROBLEMS } from "../utils/constants";
import { fetchProblems } from "./apiService";

export function subscribeProblems(onData) {
  let active = true;
  fetchProblems()
    .then((items) => {
      if (active) onData(items.length ? items : SAMPLE_PROBLEMS);
    })
    .catch(() => {
      if (active) onData(SAMPLE_PROBLEMS);
    });
  return () => {
    active = false;
  };
}

export async function fetchProblem(id) {
  try {
    const problems = await fetchProblems();
    return problems.find((item) => item.id === id || item.code === id) || SAMPLE_PROBLEMS.find((item) => item.id === id) || null;
  } catch {
    return SAMPLE_PROBLEMS.find((item) => item.id === id) || null;
  }
}
