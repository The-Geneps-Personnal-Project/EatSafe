import { useEffect, useState } from "react";
import { Chip, Box, Typography, Tooltip, Divider, IconButton, Popover } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

export const getRatingColor = (rating: 1 | 2 | 3 | 4): string => {
    switch (rating) {
        case 1: return "#2196f3";
        case 2: return "#4caf50";
        case 3: return "#ff9800";
        case 4: return "#f44336";
    }
};

const ratingLabels: Record<1 | 2 | 3 | 4, string> = {
    1: "Très satisfaisant",
    2: "Satisfaisant",
    3: "À améliorer",
    4: "À corriger de manière urgente"
};

const ratingExplanations: Record<1 | 2 | 3 | 4, string> = {
    1: "Conforme : bonnes pratiques d’hygiène en place, contrôles maîtrisés.",
    2: "Globalement conforme : quelques écarts mineurs à corriger.",
    3: "Plusieurs écarts : actions correctives demandées rapidement.",
    4: "Non-conformités majeures : corrections urgentes exigées."
};

type Props = {
    score: 1 | 2 | 3 | 4;
};

const LegendContent = () => (
    <Box sx={{ p: 1, bgcolor: "#424242" }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom color="white">
            Comprendre l’échelle
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 1, mb: 1 }}>
            {[1, 2, 3, 4].map((s) => (
                <Box key={s as number} sx={{ display: "contents" }}>
                    <Box sx={{ width: 12, height: 12, mt: "4px", borderRadius: "50%", bgcolor: getRatingColor(s as 1 | 2 | 3 | 4) }} />
                    <Typography variant="body2" color="white">
                        <strong>{s} — {ratingLabels[s as 1 | 2 | 3 | 4]}</strong>{" · "}{ratingExplanations[s as 1 | 2 | 3 | 4]}
                    </Typography>
                </Box>
            ))}
        </Box>
        <Divider sx={{ my: 1, bgcolor: "rgba(255,255,255,0.2)" }} />
        <Typography variant="caption" color="white">
            Les contrôles portent notamment sur : propreté des locaux et équipements, chaîne du froid/chaud, prévention des contaminations, traçabilité et gestion des non-conformités, gestion des déchets, et hygiène/formation du personnel.
        </Typography>
    </Box>
);

const RatingChip = ({ score }: Props) => {
    const [isTouch, setIsTouch] = useState(false);
    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setIsTouch(typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0));
    }, []);

    return (
        <Box display="flex" alignItems="center" gap={1} mt={2}>
            <Typography variant="caption" color="text.primary">
                Score sanitaire
            </Typography>
            <Chip
                label={<Box component="span" sx={{ px: 1 }}>{ratingLabels[score]}</Box>}
                sx={{ backgroundColor: getRatingColor(score), color: "white", fontWeight: "bold", borderRadius: "999px", height: 24, fontSize: "0.75rem", lineHeight: 1, minWidth: 0, p: 0 }}
                size="small"
                aria-label={`Score sanitaire : ${ratingLabels[score]}`}
            />
            {isTouch ? (
                <>
                    <IconButton
                        size="small"
                        sx={{ color: "#bdbdbd", p: 0 }}
                        onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setOpen((v) => !v);
                        }}
                    >
                        <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                    <Popover
                        open={open}
                        anchorEl={anchorEl}
                        onClose={() => setOpen(false)}
                        anchorOrigin={{ vertical: "top", horizontal: "center" }}
                        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                        disableScrollLock
                        slotProps={{ paper: { sx: { bgcolor: "transparent", boxShadow: "none", opacity: 0.7 } } }}
                        sx={{ zIndex: 9999 }}
                    >
                        <Box sx={{ boxShadow: 3, borderRadius: 1, overflow: "hidden" }}>
                            <LegendContent />
                        </Box>
                    </Popover>
                </>
            ) : (
                <Tooltip
                    arrow
                    placement="top"
                    enterTouchDelay={0}
                    title={<LegendContent />}
                    slotProps={{
                        popper: { sx: { zIndex: 9999 } },
                        tooltip: { sx: { maxWidth: 360, p: 0, opacity: 0.7 } },
                        arrow: { sx: { color: "#424242" } },
                    }}
                >
                    <IconButton size="small" sx={{ color: "#bdbdbd", p: 0 }}>
                        <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
};

export default RatingChip;
