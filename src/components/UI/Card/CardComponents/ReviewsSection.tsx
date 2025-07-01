import { Box, Typography, Link } from "@mui/material";
import type { Restaurant } from "@schemas/restaurant";
import ReviewsList from "./Reviews/ReviewsList";

interface Props {
    restaurant: Restaurant;
}

export default function ReviewsSection({ restaurant }: Props) {
    const reviews = restaurant.reviews || [];

    return (
        <Box mt={3}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Avis Google
            </Typography>

            {reviews.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Aucune donnée trouvée.
                </Typography>
            ) : (
                <ReviewsList reviews={reviews.filter((r) => typeof r.rating === "number") as any} />
            )}

            {reviews.length > 2 && (
                <Box mt={1}>
                    <Link
                        href={`https://www.google.com/search?q=${encodeURIComponent(
                            `${restaurant.name} ${restaurant.address}`
                        )}`}
                        target="_blank"
                        rel="noopener"
                    >
                        Voir plus sur Google
                    </Link>
                </Box>
            )}
        </Box>
    );
}
