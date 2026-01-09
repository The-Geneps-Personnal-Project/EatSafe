import { Box, IconButton, SwipeableDrawer, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { ReactNode } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    mode: "mobile" | "desktop";
    children: ReactNode;
};

export default function RecommendationPanel({ open, onClose, mode, children }: Props) {
    const theme = useTheme();
    if (mode === "mobile") {
        return (
            <SwipeableDrawer
                anchor="bottom"
                open={open}
                onOpen={() => {}}
                onClose={onClose}
                disableDiscovery
                PaperProps={{ sx: { borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: "85vh" } }}
            >
                <Header title="Recommandations" onClose={onClose} />
                {children}
            </SwipeableDrawer>
        );
    }
    return (
        <Box
            role="dialog"
            aria-label="Recommandations"
            hidden={!open}
            sx={{
                position: "fixed",
                right: 16,
                bottom: 16,
                width: 420,
                maxHeight: "80vh",
                display: open ? "block" : "none",
                zIndex: theme.zIndex.modal,
                boxShadow: 6,
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: "background.paper"
            }}
        >
            <Header title="Recommandations" onClose={onClose} />
            {children}
        </Box>
    );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, bgcolor: "background.default" }}>
            <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
            <IconButton aria-label="Fermer" onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
    );
}
