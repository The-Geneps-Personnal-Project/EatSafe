import { useEffect, useState } from "react";
import { Button } from "@mui/material";

export default function AddToHomeScreenButton({ fullWidth = false }: { fullWidth?: boolean }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstall, setShowInstall] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("User install choice:", outcome);

        setDeferredPrompt(null);
        setShowInstall(false);
    };

    if (!showInstall) return null;

    return (
        <Button
            onClick={handleClick}
            variant="outlined"
            fullWidth={fullWidth}
            sx={{ bgcolor: "white", textTransform: "none" }}
            >
            📲 Ajouter à l'écran d'accueil
        </Button>
    );
}
