import { CircularProgress } from "@mui/material";

const Spinner = () => {
    return (
        <CircularProgress
            size={48}
            sx={{
                color: "#000",
                zIndex: 10001,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
            }}
        />
    );
};

export default Spinner;