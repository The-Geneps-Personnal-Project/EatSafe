import { useEffect, useState } from "react";
import Papa from "papaparse";
import type { Restaurant } from "@schemas/restaurant";

const DATA_URL = "https://www.data.gouv.fr/fr/datasets/r/fdfabe62-a581-41a1-998f-73fc53da3398";

interface RawRestaurantRow {
    APP_Libelle_etablissement: string;
    Adresse_2_UA: string;
    APP_Code_synthese_eval_sanit: string;
    Synthese_eval_sanit: string;
    APP_Libelle_activite_etablissement: string;
    filtre: string;
    Date_inspection: string;
    geores: string;
    SIRET?: string;
    [key: string]: any;
}

export const useRestaurantsData = () => {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Papa.parse<RawRestaurantRow>(DATA_URL, {
            download: true,
            header: true,
            complete: (result) => {
                const parsed: Restaurant[] = result.data
                    .filter((row) =>
                        row.filtre === "Restaurants" &&
                        row.APP_Code_synthese_eval_sanit &&
                        row.geores &&
                        row.APP_Libelle_etablissement
                    )
                    .map((row, index) => {
                        const coords = row.geores
                            .replace(/[()]/g, "")
                            .split(",")
                            .map(Number);

                        const [lat, lng] = coords;
                        const code = parseInt(row.APP_Code_synthese_eval_sanit);

                        return {
                            id: row.SIRET ? `${row.SIRET}-${index}` : `row-${index}`,
                            name: row.APP_Libelle_etablissement,
                            lat,
                            lng,
                            address: row.Adresse_2_UA || "",
                            local_rating: [1, 2, 3, 4].includes(code) ? (code as 1 | 2 | 3 | 4) : 1,
                            local_rating_description: row.Synthese_eval_sanit || "",
                            inspection_date: row.Date_inspection || "",
                            fromLocalDataset: true,
                        };
                    });

                setRestaurants(parsed);
                setLoading(false);
            },
            error: (err) => {
                console.error("Error parsing CSV:", err);
                setLoading(false);
            }
        });
    }, []);

    return { restaurants, loading };
};
