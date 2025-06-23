import { useEffect, useRef } from "react";

export const useAutocompleteService = () => {
    const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

    useEffect(() => {
        if (!serviceRef.current && window.google?.maps) {
            serviceRef.current = new window.google.maps.places.AutocompleteService();
        }
    }, []);

    const getPredictions = (input: string): Promise<google.maps.places.AutocompletePrediction[]> => {
        return new Promise((resolve, reject) => {
            if (!serviceRef.current || !input) return resolve([]);
            serviceRef.current.getPlacePredictions(
                { input, componentRestrictions: { country: "fr" } },
                (predictions, status) => {
                    if (status !== "OK" || !predictions) return resolve([]);
                    resolve(predictions);
                }
            );
        });
    };

    return { getPredictions };
};
