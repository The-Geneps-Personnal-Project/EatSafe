import { useEffect, useMemo, useState } from "react";
import { Box, Fab, useMediaQuery } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import { useTheme } from "@mui/material/styles";
import { useRecommendations } from "@hooks/useRecommendations";
import type { Recommendation } from "@schemas/recommendation";
import RecommendationPanel from "./panel/RecommendationPanel";
import PanelContent from "./panel/PanelContent";
import useRecoPrefs from "./state/useRecoPrefs";
import type { LatLng } from "@hooks/useGeo";

type Props = {
    initialLatLng: LatLng;
    onResults?: (results: Recommendation[]) => void;
    limit?: number;
    className?: string;
};

export default function RecommendationChat({ initialLatLng, onResults, limit = 10, className }: Props) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [open, setOpen] = useState(false);
    const { loading, error, results, get, reset } = useRecommendations();

    const {
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
    } = useRecoPrefs(limit);

    useEffect(() => {
        hydrateFrom(initialLatLng);
    }, [initialLatLng, hydrateFrom]);

    useEffect(() => {
        persist();
    }, [coords, cuisines, radiusKm, wheelchair, openNow, minScore, priceRanges, resultLimit, persist]);

    const canSubmit = useMemo(() => !!coords && !!radiusKm && !loading, [coords, radiusKm, loading]);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        const res = await get({
            lat: coords.lat,
            lng: coords.lng,
            radius: Number(radiusKm),
            limit: resultLimit,
            cuisine: cuisines.length ? cuisines : undefined,
            wheelchair,
            open_now: openNow,
            min_local_score: minScore,
            price_ranges: priceRanges.length ? priceRanges : undefined
        } as any);
        onResults?.(res);
    };

    const handleUseMyLocation = () => {
        setGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords: c }) => {
                setCoords({ lat: Number(c.latitude), lng: Number(c.longitude) });
                setGeoLoading(false);
            },
            () => setGeoLoading(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <Box className={className}>
            <Fab
                color="primary"
                aria-label="Recommandations"
                onClick={() => setOpen(true)}
                sx={{ position: "fixed", right: 16, bottom: 16, zIndex: open && isMobile ? 10 : theme.zIndex.fab }}
            >
                <ChatIcon />
            </Fab>

            <RecommendationPanel
                open={open}
                onClose={() => setOpen(false)}
                mode={isMobile ? "mobile" : "desktop"}
            >
                <PanelContent
                    coords={coords}
                    setCoords={setCoords}
                    onUseMyLocation={handleUseMyLocation}
                    geoLoading={geoLoading}
                    cuisines={cuisines}
                    setCuisines={setCuisines}
                    radiusKm={radiusKm}
                    setRadiusKm={setRadiusKm}
                    wheelchair={wheelchair}
                    setWheelchair={setWheelchair}
                    openNow={openNow}
                    setOpenNow={setOpenNow}
                    minScore={minScore}
                    setMinScore={setMinScore}
                    priceRanges={priceRanges}
                    setPriceRanges={setPriceRanges}
                    resultLimit={resultLimit}
                    setResultLimit={setResultLimit}
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                    results={results}
                    reset={reset}
                />
            </RecommendationPanel>
        </Box>
    );
}
