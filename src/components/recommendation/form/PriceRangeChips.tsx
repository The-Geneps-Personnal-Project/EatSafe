import { Box, Chip, FormLabel } from "@mui/material";

type Value = "low" | "mid" | "high";

type Props = {
	value: Value[];
	onChange: (v: Value[]) => void;
};

export default function PriceRangeChips({ value, onChange }: Props) {
	const select = (v: Exclude<Value, undefined>) => {
		const has = value.includes(v);
		onChange(has ? value.filter(x => x !== v) : [...value, v]);
	};
	return (
		<Box sx={{ display: "flex", gap: 1 }}>
            <FormLabel>Prix</FormLabel>
			<Chip
				label="$"
				clickable
				color={value.includes("low") ? "primary" : "default"}
                variant={value.includes("low") ? "filled" : "outlined"}
				onClick={() => select("low")}
				size="small"
			/>
			<Chip
				label="$$"
				clickable
				color={value.includes("mid") ? "primary" : "default"}
                variant={value.includes("mid") ? "filled" : "outlined"}
				onClick={() => select("mid")}
				size="small"
			/>
			<Chip
				label="$$$"
				clickable
				color={value.includes("high") ? "primary" : "default"}
                variant={value.includes("high") ? "filled" : "outlined"}
				onClick={() => select("high")}
				size="small"
			/>
		</Box>
	);
}
