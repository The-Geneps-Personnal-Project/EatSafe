import { Snackbar, Alert } from "@mui/material";

type ToastProps = {
    open: boolean;
    message: string;
    severity?: "error" | "warning" | "info" | "success";
    onClose: () => void;
    duration?: number;
};

export default function Toast({
    open,
    message,
    severity = "info",
    onClose,
    duration = 5000,
}: ToastProps) {
    return (
        <Snackbar
            open={open}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
            <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
                {message}
            </Alert>
        </Snackbar>
    );
}
