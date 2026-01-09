import { Box, Card, CardContent, Chip, Divider, Stack, Typography, Button } from "@mui/material";
import CuisineMultiSelect from "../form/CuisineMultiSelect";
import DistanceSelector from "../form/DistanceSelector";
import OptionsToggles from "../form/OptionsToggles";
import LocationStep from "../form/LocationStep";
import MinScoreSelector from "../form/MinScoreSelector";
import PriceRangeChips from "../form/PriceRangeChips";
import ResultLimitChips from "../form/ResultLimitChips";
import ResultsList from "../ResultsList";
import type { Recommendation } from "@schemas/recommendation";
import type { LatLng } from "@hooks/useGeo";

export interface PanelContentProps {
    coords: LatLng;
    setCoords: (p: LatLng) => void;
    onUseMyLocation: () => void;
    geoLoading: boolean;
    cuisines: string[];
    setCuisines: (v: string[]) => void;
    radiusKm: number;
    setRadiusKm: (v: number) => void;
    wheelchair: boolean;
    setWheelchair: (v: boolean) => void;
    openNow: boolean;
    setOpenNow: (v: boolean) => void;
    minScore?: 1 | 2 | 3 | 4;
    setMinScore: (v: 1 | 2 | 3 | 4 | undefined) => void;
    priceRanges: Array<"low" | "mid" | "high">;
    setPriceRanges: (v: Array<"low" | "mid" | "high">) => void;
    resultLimit: number;
    setResultLimit: (n: number) => void;
    onSubmit: () => void;
    loading: boolean;
    error: string | null;
    results: Recommendation[];
    reset: () => void;
}

export default function PanelContent({
    coords, setCoords, onUseMyLocation, geoLoading,
    cuisines, setCuisines,
    radiusKm, setRadiusKm,
    wheelchair, setWheelchair,
    openNow, setOpenNow,
    minScore, setMinScore,
    priceRanges, setPriceRanges,
    resultLimit, setResultLimit,
    onSubmit, loading, error, results, reset
}: PanelContentProps) {
    return (
        <Card elevation={0} square>
            <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                    <LocationStep coords={coords} onUseMyLocation={onUseMyLocation} onPlacePicked={setCoords} loading={geoLoading} />
                    <CuisineMultiSelect value={cuisines} onChange={setCuisines} />
                    <DistanceSelector value={String(radiusKm)} onChange={(v) => setRadiusKm(Number(v))} />
                    <ResultLimitChips value={resultLimit} onChange={setResultLimit} />
                    <OptionsToggles
                        wheelchair={wheelchair}
                        openNow={openNow}
                        onWheelchairChange={setWheelchair}
                        onOpenNowChange={setOpenNow}
                    />
                    <MinScoreSelector value={minScore} onChange={setMinScore} />
                    <PriceRangeChips value={priceRanges} onChange={setPriceRanges} />
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button variant="contained" fullWidth disabled={loading} onClick={onSubmit}>{loading ? "Recherche..." : "Lancer la recommandation"}</Button>
                        <Button variant="outlined" color="inherit" onClick={reset}>Réinitialiser</Button>
                    </Box>
                    {error && <Typography variant="body2" color="error">{error}</Typography>}
                    {results.length > 0 && (
                        <>
                            <Divider />
                            <Typography variant="subtitle2" fontWeight={700}>Résultats</Typography>
                            <ResultsList results={results} />
                        </>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}

function mapLocalScore(s: 1 | 2 | 3 | 4): string {
    if (s === 1) return "Très satisfaisant";
    if (s === 2) return "Satisfaisant";
    if (s === 3) return "À améliorer";
    return "Urgent";
}

function chipColorFromScore(s: 1 | 2 | 3 | 4): "primary" | "success" | "warning" | "error" {
    if (s === 1) return "primary";
    if (s === 2) return "success";
    if (s === 3) return "warning";
    return "error";
}
