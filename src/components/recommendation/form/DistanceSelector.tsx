import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";

type Props = {
    value: string;
    onChange: (v: string) => void;
    options?: string[];
};

export default function DistanceSelector({ value, onChange, options }: Props) {
    const opts = options ?? ["1", "2", "5", "10"];
    return (
        <FormControl>
            <FormLabel>Distance maximale</FormLabel>
            <RadioGroup row value={value} onChange={(e) => onChange(e.target.value)}>
                {opts.map((o) => (
                    <FormControlLabel key={o} value={o} control={<Radio />} label={`${o} km`} />
                ))}
            </RadioGroup>
        </FormControl>
    );
}
