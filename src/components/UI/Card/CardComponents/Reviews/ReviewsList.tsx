import React from "react";
import { List, Divider } from "@mui/material";
import ReviewItem from "./ReviewItem";
import { Review } from "@/types/restaurant";

interface Props {
    reviews: Review[];
    maxItems?: number;
}

export default function ReviewsList({ reviews, maxItems = 2 }: Props) {
    const slice = reviews.slice(0, maxItems);
    return (
        <List disablePadding>
            {slice.map((rev, i) => (
                <React.Fragment key={i}>
                    <ReviewItem review={{ ...rev, profile_photo_url: rev.profile_photo_url ?? "" }} />
                    {i < slice.length - 1 && <Divider component="li" />}
                </React.Fragment>
            ))}
        </List>
    );
}
