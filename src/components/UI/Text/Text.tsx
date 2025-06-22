import React from "react";
import { Typography } from "@mui/material";

type Props = {
    children: React.ReactNode;
    variant?: "h1" | "h2" | "body1" | "body2";
};

const Text = ({ children, variant = "body1" }: Props) => {
    return <Typography variant={variant}>{children}</Typography>;
};

export default Text;