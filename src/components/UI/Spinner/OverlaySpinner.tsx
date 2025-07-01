import { Box, Typography } from "@mui/material";
import Spinner from "./Spinner";

const OverlaySpinner = () => (
    <Box
        sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "#fff",
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            textAlign: "center"
        }}
    >
        <Box>
            <Typography variant="h6" fontWeight={700} color="black" mb={2}>
                🕵️‍♂️ Inspection sanitaire en cours...
            </Typography>
            <Spinner />
        </Box>
    </Box>
);

export default OverlaySpinner;
