import {
    Box,
    Avatar,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
} from "@mui/material";
import RatingStars from "./RatingStars";
import { Review } from "@/types/restaurant";

interface Props {
    review: Review
}

export default function ReviewItem({ review }: Props) {
    return (
        <ListItem alignItems="flex-start" disableGutters>
            <ListItemAvatar>
                <Avatar
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    sx={{ width: 32, height: 32 }}
                />
            </ListItemAvatar>
            <ListItemText
                disableTypography
                primary={
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body2" fontWeight={500}>
                            {review.author_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            · {review.relative_time_description}
                        </Typography>
                    </Box>
                }
                secondary={
                    <Box mt={0.5}>
                        <RatingStars rating={review.rating || 0} />
                        <Typography
                            variant="body2"
                            sx={{
                                mt: 0.5,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {review.text}
                        </Typography>
                    </Box>
                }
            />
        </ListItem>
    );
}
