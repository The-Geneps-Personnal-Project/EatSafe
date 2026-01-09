import { Box, Button, TextField, Typography, GlobalStyles, useTheme } from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import { useEffect, useRef, useState } from "react";
import { LatLng } from "@hooks/useGeo";

type Props = {
    coords: LatLng | null;
    onUseMyLocation: () => void;
    onPlacePicked: (p: LatLng) => void;
    loading?: boolean;
};

export default function LocationStep({ coords, onUseMyLocation, onPlacePicked, loading }: Props) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const theme = useTheme();
    const pacZ = (theme.zIndex.modal ?? 1300) + 10;

    useEffect(() => {
        const g = (window as any).google;
        if (!g?.maps?.places || !inputRef.current) return;
        const autocomplete = new g.maps.places.Autocomplete(inputRef.current, { fields: ["geometry"] });
        const listener = autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const loc = place?.geometry?.location;
            if (loc) onPlacePicked({ lat: loc.lat(), lng: loc.lng() });
        });
        return () => {
            if (listener && listener.remove) listener.remove();
        };
    }, [onPlacePicked]);

    return (
        <>
            <GlobalStyles styles={{
                ".pac-container": { zIndex: pacZ },
                ".pac-item": { fontSize: "0.9rem" }
            }} />
            <Box sx={{ display: "grid", gap: 1.5, overflow: "visible" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mt: 1 }}>
                    <RoomIcon fontSize="small" />
                    <Typography variant="caption">
                        {coords ? `Point de départ : ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Choisissez un point de départ"}
                    </Typography>
                </Box>
                <Button variant="outlined" onClick={onUseMyLocation} disabled={loading} size="small">
                    {loading ? "Localisation..." : "Utiliser ma position"}
                </Button>
                <TextField
                    inputRef={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    size="small"
                    label="Ou saisir un lieu"
                    placeholder="Adresse, ville, lieu..."
                    fullWidth
                    inputProps={{ autoComplete: "off" }}
                />
            </Box>
        </>
    );
}
