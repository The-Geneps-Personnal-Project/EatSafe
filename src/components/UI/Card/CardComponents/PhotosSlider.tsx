import { useState } from "react";
import { Box, Typography } from "@mui/material";
import type { Photo } from "@schemas/restaurant";

type Props = {
    photos: Photo[];
};

const PhotosSlider = ({ photos }: Props) => {
    const [visiblePhotos, setVisiblePhotos] = useState(photos);

    if (!visiblePhotos.length) return null;

    const getPhotoUrl = (photo_reference: string, maxWidth = 400) => {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            throw new Error("REACT_APP_GOOGLE_MAPS_API_KEY is not defined. Please set the environment variable to use Google Maps API.");
        }
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${encodeURIComponent(photo_reference)}&key=${apiKey}`;
    };

    const handleImageError = (photo_reference: string) => {
        setVisiblePhotos((prev) =>
            prev.filter((p) => p.photo_reference !== photo_reference)
        );
    };

    return (
        <>
            <Typography variant="subtitle2" fontWeight={600} mt={3}>
                Photos
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
                {visiblePhotos.slice(0, 5).map((photo, idx) => {
                    const url = getPhotoUrl(photo.photo_reference);
                    return (
                        <Box
                            key={photo.photo_reference}
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
                            onError={() => handleImageError(photo.photo_reference)}
                        />
                    );
                })}
            </Box>
        </>
    );
};

export default PhotosSlider;
