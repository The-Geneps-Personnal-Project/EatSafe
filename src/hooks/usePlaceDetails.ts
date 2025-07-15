export const usePlaceDetails = () => {
    const getPlaceDetails = (placeId: string): Promise<google.maps.places.PlaceResult | null> => {
        return new Promise((resolve, reject) => {
            const service = new google.maps.places.PlacesService(document.createElement("div"));
            service.getDetails({ placeId }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    resolve(place);
                } else {
                    console.error("Place details error:", status);
                    resolve(null);
                }
            });
        });
    };


    return {
        getPlaceDetails,
    };
};