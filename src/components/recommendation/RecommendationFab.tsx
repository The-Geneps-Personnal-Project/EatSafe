import { Fab } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";

type Props = {
    open: boolean;
    onOpen: () => void;
    zIndex?: number;
};

export default function RecommendationFab({ open, onOpen, zIndex }: Props) {
    return (
        <Fab
            color="primary"
            aria-label="Recommandations"
            onClick={onOpen}
            sx={{
                position: "fixed",
                right: 16,
                bottom: 16,
                zIndex: zIndex ?? 1500
            }}
        >
            <ChatIcon />
        </Fab>
    );
}
