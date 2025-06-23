import { Box, Typography } from "@mui/material";

const ReviewsSection = () => {
    return (
        <Box mt={3}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Avis Google (à venir)
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Les avis clients s'afficheront ici dès qu'ils seront disponibles.
            </Typography>
        </Box>
    );
};

export default ReviewsSection;