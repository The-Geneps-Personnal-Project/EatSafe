import {
    GoogleMap,
    LoadScript,
    Marker,
    MarkerClusterer
} from "@react-google-maps/api";
import { mockRestaurants } from "../../utils/mockRestaurants";
import { getSymbolIcon } from "../../utils/markerColors";

const containerStyle = {
    width: "100%",
    height: "100vh"
};

const center = {
    lat: 46.603354,
    lng: 1.888334
};

const MapWrapper = () => {
    return (
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={6}
            >
                <MarkerClusterer>
                    {(clusterer) => (
                        <>
                            {mockRestaurants.map((restaurant) => (
                                <Marker
                                    key={restaurant.id}
                                    position={{ lat: restaurant.lat, lng: restaurant.lng }}
                                    icon={getSymbolIcon(restaurant.rating)}
                                    clusterer={clusterer}
                                    title={restaurant.name}
                                />
                            ))}
                        </>
                    )}
                </MarkerClusterer>
            </GoogleMap>
        </LoadScript>
    );
};

export default MapWrapper;