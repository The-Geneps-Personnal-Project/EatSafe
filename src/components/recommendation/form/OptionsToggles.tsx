import { Box, Checkbox, FormControlLabel } from "@mui/material";
import AccessibleIcon from "@mui/icons-material/Accessible";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

type Props = {
    wheelchair: boolean;
    openNow: boolean;
    onWheelchairChange: (v: boolean) => void;
    onOpenNowChange: (v: boolean) => void;
};

export default function OptionsToggles({ wheelchair, openNow, onWheelchairChange, onOpenNowChange }: Props) {
    return (
        <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
            <FormControlLabel
                control={<Checkbox checked={wheelchair} onChange={(e) => onWheelchairChange(e.target.checked)} icon={<AccessibleIcon />} checkedIcon={<AccessibleIcon />} />}
                label="PMR"
            />
            <FormControlLabel
                control={<Checkbox checked={openNow} onChange={(e) => onOpenNowChange(e.target.checked)} icon={<AccessTimeIcon />} checkedIcon={<AccessTimeIcon />} />}
                label="Ouvert maintenant"
            />
        </Box>
    );
}
