import { Recommendation } from "@schemas/recommendation";

export function getResultsBounds(results: Recommendation[]) {
    if (!results.length) return null;
    let minLat = results[0].lat, maxLat = results[0].lat, minLng = results[0].lng, maxLng = results[0].lng;
    for (const r of results) {
        if (r.lat < minLat) minLat = r.lat;
        if (r.lat > maxLat) maxLat = r.lat;
        if (r.lng < minLng) minLng = r.lng;
        if (r.lng > maxLng) maxLng = r.lng;
    }
    return { south: minLat, west: minLng, north: maxLat, east: maxLng };
}
