import { useCallback, useRef, useState } from "react";
import { Recommendation, RecommendationQuery } from "@schemas/recommendation";
import { fetchRecommendations } from "@services/recommendationService";

type State = {
    loading: boolean;
    error: string | null;
    results: Recommendation[];
    lastQuery?: RecommendationQuery;
};

export function useRecommendations() {
    const [state, setState] = useState<State>({
        loading: false,
        error: null,
        results: []
    });
    const abortRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        setState({ loading: false, error: null, results: [] });
    }, []);

    const get = useCallback(async (query: RecommendationQuery) => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setState((s) => ({ ...s, loading: true, error: null, lastQuery: query }));
        try {
            const results = await fetchRecommendations(query);
            setState({ loading: false, error: null, results, lastQuery: query });
            return results;
        } catch (err: any) {
            if (err?.name === "CanceledError" || err?.name === "AbortError") {
                return [];
            }
            const msg = err?.message ?? "Unknown error";
            setState((s) => ({ ...s, loading: false, error: msg }));
            return [];
        }
    }, []);

    return {
        loading: state.loading,
        error: state.error,
        results: state.results,
        lastQuery: state.lastQuery,
        get,
        reset
    };
}
