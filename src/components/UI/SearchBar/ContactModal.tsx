import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Snackbar,
    Alert,
} from "@mui/material";
import { sendContactMessage } from "@services/contactService";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function ContactModal({ open, onClose }: Props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!message.trim()) {
        setError("Le message est requis.");
        return;
        }
        setError("");
        setLoading(true);
        try {
        await sendContactMessage({ name, email, message });
        setSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
        onClose();
        } catch (err) {
        setError("Erreur lors de l'envoi du message.");
        } finally {
        setLoading(false);
        }
    };

    return (
        <>
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            scroll="paper"
            PaperProps={{
            sx: {
                maxHeight: { xs: "90dvh", sm: "80vh" },
            },
            }}
        >
            <DialogTitle>Contact</DialogTitle>
            <DialogContent>
            <TextField
                fullWidth
                required
                label="Nom"
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <TextField
                fullWidth
                required
                label="Email"
                margin="normal"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
                fullWidth
                label="Message"
                margin="normal"
                required
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                error={!!error}
                helperText={error}
            />
            </DialogContent>
            <DialogActions>
            <Button onClick={onClose}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={loading} variant="contained">
                Envoyer
            </Button>
            </DialogActions>
        </Dialog>

        <Snackbar
            open={success}
            autoHideDuration={4000}
            onClose={() => setSuccess(false)}
        >
            <Alert severity="success">Message envoyé avec succès</Alert>
        </Snackbar>
        </>
    );
}
