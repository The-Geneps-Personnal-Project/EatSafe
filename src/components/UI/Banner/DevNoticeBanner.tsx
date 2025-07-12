import { useState, useEffect } from "react";
import { Button, Typography, Slide, Paper } from "@mui/material";

export default function DevNoticeBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const alreadySeen = localStorage.getItem("devNoticeSeen");
        if (!alreadySeen) {
            setVisible(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem("devNoticeSeen", "true");
        setVisible(false);
    };

    return (
        <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
            <Paper
                elevation={4}
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: "20%",
                    width: "60%",
                    bgcolor: "background.paper",
                    p: 2,
                    zIndex: 1500,
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                }}
            >
                <Typography variant="body2" sx={{ textAlign: "center" }}>
                    🚧 Ce projet est en cours de développement. Vous pouvez proposer des améliorations ou signaler des bugs via le bouton <strong>Contact</strong>.
                </Typography>
                <Button variant="contained" size="small" onClick={handleClose}>
                    J'ai compris
                </Button>
            </Paper>
        </Slide>
    );
}
