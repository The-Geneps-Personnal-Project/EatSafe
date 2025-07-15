import axios from "./axiosInstance";

interface ContactPayload {
    name: string;
    email: string;
    message: string;
}

export async function sendContactMessage(payload: ContactPayload) {
    return axios.post("/contact", payload);
}