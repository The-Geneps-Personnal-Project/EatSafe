export const getSymbolIcon = (rating: number): google.maps.Symbol => {
    const colorMap: Record<number, string> = {
        1: "#2196f3", // blue
        2: "#4caf50", // green
        3: "#ff9800", // orange
        4: "#f44336"  // red
    };

    return {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: colorMap[rating] || "#9c27b0",
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: "#ffffff"
    };
};