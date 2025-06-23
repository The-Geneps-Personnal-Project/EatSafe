import { Box, Typography } from "@mui/material";

type Props = {
    photos: google.maps.places.PlacePhoto[];
};

const PhotosSlider = ({ photos }: Props) => {
    if (!photos.length) return null;

    return (
        <>
            <Typography variant="subtitle2" fontWeight={600} mt={3}>
                Photos Google
            </Typography>
            <Box
                sx={{
                    display: "flex",
                    overflowX: "auto",
                    gap: 2,
                    py: 2,
                    px: 1
                }}
            >
                {photos.slice(0, 5).map((photo, idx) => {
                    const url = photo.getUrl({ maxWidth: 300, maxHeight: 200 });
                    return (
                        <Box
                            key={idx}
                            component="img"
                            src={url}
                            alt={`Google photo ${idx + 1}`}
                            sx={{
                                height: 120,
                                width: "auto",
                                borderRadius: 2,
                                boxShadow: 1,
                                flexShrink: 0
                            }}
                        />
                    );
                })}
            </Box>
        </>
    );
};

export default PhotosSlider;
