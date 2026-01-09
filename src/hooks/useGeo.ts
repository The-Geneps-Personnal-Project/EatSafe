import { useCallback, useState } from "react";

export type LatLng = { lat: number; lng: number };

export function useGeo(initial?: LatLng) {
    const [coords, setCoords] = useState<LatLng | null>(initial ?? null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const geolocate = useCallback(() => {
        setLoading(true);
        setError(null);
        if (!navigator.geolocation) {
            setLoading(false);
            setError("La géolocalisation n’est pas disponible.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLoading(false);
            },
            () => {
                setError("Impossible d’obtenir votre position.");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    }, []);

    const setManual = useCallback((p: LatLng) => {
        setCoords(p);
        setError(null);
    }, []);

    return { coords, loading, error, geolocate, setManual };
}
