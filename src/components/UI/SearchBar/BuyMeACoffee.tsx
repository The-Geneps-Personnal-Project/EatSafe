import { Button } from "@mui/material";

interface BuyMeACoffeeButtonProps {
    url?: string;
    fullWidth?: boolean;
}

export default function BuyMeACoffeeButton({
    url = "https://buymeacoffee.com/eatsafe",
    fullWidth = false,
}: BuyMeACoffeeButtonProps) {
    return (
        <Button
            variant="outlined"
            fullWidth={fullWidth}
            sx={{
                bgcolor: "white",
                textTransform: "none",
            }}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
        >
            💛 Soutenir le projet
        </Button>
    );
}