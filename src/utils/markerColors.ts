export const getSymbolIcon = (rating: 1 | 2 | 3 | 4): string => {
    const baseUrl = "/pins";
    const colorMap: Record<1 | 2 | 3 | 4, string> = {
        1: "blue",
        2: "green",
        3: "orange",
        4: "red"
    };

    return `${baseUrl}/pin-${colorMap[rating]}.svg`;
};