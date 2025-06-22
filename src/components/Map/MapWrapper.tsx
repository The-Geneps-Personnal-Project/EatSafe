import React from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "100vh"
};

// Center of France
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
                zoom={7}
            >
            </GoogleMap>
        </LoadScript>
    );
};

export default MapWrapper;