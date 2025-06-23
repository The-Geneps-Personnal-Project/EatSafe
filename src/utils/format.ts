export const formatDate = (input: string): string => {
    const date = new Date(input);
    return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};