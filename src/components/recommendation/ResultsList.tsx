import { Box, Chip, List, ListItem, ListItemText, Typography } from "@mui/material";
import type { Recommendation } from "@schemas/recommendation";

export default function ResultsList({ results }: { results: Recommendation[] }) {
    return (
        <List dense disablePadding>
            {results.map((r) => (
                <ListItem key={r.siret ?? r.name} disableGutters sx={{ alignItems: "flex-start" }}>
                    <ListItemText
                        primary={
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                <Typography variant="body1" fontWeight={600}>{r.name}</Typography>
                                <Chip
                                    size="small"
                                    label={mapLocalScore((r as any).hygiene_score ?? (r as any).local_score)}
                                    color={chipColorFromScore((r as any).hygiene_score ?? (r as any).local_score)}
                                    variant="filled"
                                />
                            </Box>
                        }
                        secondary={
                            <Box sx={{ mt: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {r.distance_km != null ? `À ${Math.round(Number(r.distance_km) * 1000)} m` : ""} · {r.rating ? `${Number(r.rating).toFixed(1)} ★` : "Pas d'avis"}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {(r as any).match_reason ? ((r as any).match_reason as string).split("|").slice(0, 3).map((reason, i) => (
                                        <Chip key={i} size="small" label={reason.trim()} variant="outlined" />
                                    )) : null}
                                </Box>
                            </Box>
                        }
                    />
                </ListItem>
            ))}
        </List>
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
