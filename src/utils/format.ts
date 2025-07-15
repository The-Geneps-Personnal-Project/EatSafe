export const formatDate = (input: string): string => {
    const date = new Date(input);
    return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
};

export const formatTime = (hhmm: string): string => {
    const hours = parseInt(hhmm.substring(0, 2), 10);
    const minutes = parseInt(hhmm.substring(2), 10);
    const date = new Date();
    date.setHours(hours, minutes);

    return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
};

const weekdayMap = [
    "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"
];

const orderedDays = [1, 2, 3, 4, 5, 6, 0];

export const getWeekSchedule = (
    periods: {
        open: { day: number; time: string };
        close?: { day: number; time: string };
    }[]
): string[] => {
    const schedule: { [key: number]: string[] } = {};

    periods.forEach((period) => {
        const day = period.open.day;
        const openTime = formatTime(period.open.time);
        const closeTime = period.close ? formatTime(period.close.time) : "—";

        if (!schedule[day]) schedule[day] = [];
        schedule[day].push(`${openTime} – ${closeTime}`);
    });

    return orderedDays.map((dayIndex) => {
        const dayName = weekdayMap[dayIndex === 0 ? 6 : dayIndex - 1];
        const ranges = schedule[dayIndex] || [];
        return `${dayName} : ${ranges.length ? ranges.join(", ") : "Fermé"}`;
    });
};

export function extractCity(city: string): string {
    const parts = city.split(",");
    if (parts.length > 1) {
        return parts[1].trim().split(" ")[0];
    }
    return city.trim().split(" ")[0];
}

export const toTitleCase = (str: string): string => {
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};