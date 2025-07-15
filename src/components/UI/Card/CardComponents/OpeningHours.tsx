import { List, ListItem, ListItemText } from "@mui/material";
import { getWeekSchedule } from "@utils/format";

interface Props {
    periods: {
        open: { day: number; time: string };
        close?: { day: number; time: string };
    }[];
}

export default function OpeningHours({ periods }: Props) {
    const weekSchedule = getWeekSchedule(periods);

    return (
        <List disablePadding>
            {weekSchedule.map((line, idx) => (
                <ListItem
                    key={idx}
                    disableGutters
                    sx={{ py: 0.25 }}
                >
                    <ListItemText
                        primary={line}
                        primaryTypographyProps={{
                            variant: "body2",
                            color: "text.secondary",
                            lineHeight: 1,
                            fontSize: "0.875rem"
                        }}
                    />
                </ListItem>
            ))}
        </List>
    );
}
