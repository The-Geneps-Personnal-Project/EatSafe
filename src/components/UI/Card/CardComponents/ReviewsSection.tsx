import { Box, Typography, Link, Avatar } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { Restaurant } from "@schemas/restaurant";

type Props = {
    restaurant: Restaurant;
};

const ReviewsSection = ({ restaurant }: Props) => {
    const reviews = restaurant.reviews || [];

    if (reviews.length === 0) {
        return (
            <Box mt={3}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Avis Google
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Aucune donnée trouvée.
                </Typography>
            </Box>
        );
    }

    return (
        <Box mt={3}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Avis Google
            </Typography>

            {reviews.slice(0, 2).map((review, idx) => (
                <Box key={idx} mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                        {review.profile_photo_url && (
                            <Avatar src={review.profile_photo_url} alt={review.author_name} sx={{ width: 24, height: 24 }} />
                        )}
                        <Typography fontWeight={500}>{review.author_name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            · {review.relative_time_description}
                        </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mt={0.5} mb={0.5}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                                key={i}
                                sx={{
                                    fontSize: "1rem",
                                    color: i < Math.round(review.rating ?? 0) ? "#FFD700" : "#ccc"
                                }}
                            />
                        ))}
                    </Box>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            maxWidth: "100%"
                        }}
                    >
                        {review.text.slice(0, 100)}
                    </Typography>
                </Box>
            ))}

            <Typography variant="body2">
                <Link
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                        `${restaurant.name} ${restaurant.address}`
                    )}`}
                    target="_blank"
                    rel="noopener"
                    underline="hover"
                >
                    Voir plus sur Google
                </Link>
            </Typography>
        </Box>
    );
};

export default ReviewsSection;