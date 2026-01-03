import { useCallback, useState } from "react";
import type { LatLng } from "@hooks/useGeo";

type Price = "low" | "mid" | "high";

const LS_KEY = "reco_prefs_v3";

export default function useRecoPrefs(defaultLimit: number) {
    const [coords, setCoords] = useState<LatLng>({ lat: 48.8566, lng: 2.3522 });
    const [cuisines, setCuisines] = useState<string[]>([]);
    const [radiusKm, setRadiusKm] = useState<number>(2);
    const [wheelchair, setWheelchair] = useState<boolean>(false);
    const [openNow, setOpenNow] = useState<boolean>(false);
    const [minScore, setMinScore] = useState<1 | 2 | 3 | 4 | undefined>(undefined);
    const [priceRanges, setPriceRanges] = useState<Price[]>([]);
    const [resultLimit, setResultLimit] = useState<number>(defaultLimit);
    const [geoLoading, setGeoLoading] = useState<boolean>(false);

    const hydrateFrom = useCallback((fallback: LatLng) => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                setCoords(s.coords ?? fallback);
                setCuisines(Array.isArray(s.cuisines) ? s.cuisines : []);
                setRadiusKm(typeof s.radiusKm === "number" ? s.radiusKm : 2);
                setWheelchair(!!s.wheelchair);
                setOpenNow(!!s.openNow);
                setMinScore([1,2,3,4].includes(s.minScore) ? s.minScore : undefined);
                setPriceRanges(Array.isArray(s.priceRanges) ? s.priceRanges : []);
                setResultLimit(typeof s.resultLimit === "number" ? s.resultLimit : defaultLimit);
            } else {
                setCoords(fallback);
            }
        } catch {
            setCoords(fallback);
        }
    }, [defaultLimit]);

    const persist = useCallback(() => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({
                coords, cuisines, radiusKm, wheelchair, openNow, minScore, priceRanges, resultLimit
            }));
        } catch {}
    }, [coords, cuisines, radiusKm, wheelchair, openNow, minScore, priceRanges, resultLimit]);

    return {
        coords, setCoords,
        cuisines, setCuisines,
        radiusKm, setRadiusKm,
        wheelchair, setWheelchair,
        openNow, setOpenNow,
        minScore, setMinScore,
        priceRanges, setPriceRanges,
        resultLimit, setResultLimit,
        geoLoading, setGeoLoading,
        hydrateFrom, persist
    };
}
