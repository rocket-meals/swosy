import { ExpoLeaflet, MapLayer } from 'expo-leaflet'
import * as Location from 'expo-location'
import type { LatLngLiteral } from 'leaflet'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Button,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { mapMarkers, mapShapes } from './mockData'
import {Input} from "native-base";
import {Layout} from "../../../../kitcheningredients";
import {useSynchedDirectusSettings} from "../../../helper/synchedJSONState";

/**
 * Copied working example from:
 *
 * https://github.com/Dean177/expo-leaflet
 *
 */

const mapOptions = {
    attributionControl: false,
    zoomControl: Platform.OS === 'web',
}

const initialPosition = {
    lat: 52.27140151152191,
    lng: 8.044228603458789,
}

const styles = StyleSheet.create({
    header: {
        height: 60,
        backgroundColor: 'dodgerblue',
        paddingHorizontal: 10,
        paddingTop: 30,
        width: '100%',
    },
    headerText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    mapControls: {
        backgroundColor: 'rgba(255,255,255,.5)',
        borderRadius: 5,
        bottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        left: 0,
        marginHorizontal: 10,
        padding: 7,
        position: 'absolute',
        right: 0,
    },
    mapButton: {
        alignItems: 'center',
        height: 42,
        justifyContent: 'center',
        width: 42,
    },
    mapButtonEmoji: {
        fontSize: 28,
    },
})

export const MapLeaflet = (props: any) => {

    let dimension = props.dimension;

    const [zoom, setZoom] = useState(7)
    const [debug, setDebug] = useState(7)
    const [mapCenterPosition, setMapCenterPosition] = useState(initialPosition)
    const [clickedPosition, setClickedPosition] = useState({lat: undefined, lng: undefined});
    const [ownPosition, setOwnPosition] = useState<null | LatLngLiteral>(null)

    const [directusSettings, setDirectusSettings] = useSynchedDirectusSettings();

    function handleClickedAt(lat, lng){
        setClickedPosition({lat: lat, lng: lng});
    }

    function getMapLayers(){


        const MapBoxAccessToken = directusSettings?.mapbox_key // "pk.eyJ1Ijoid2hlcmVzbXl3YXZlcyIsImEiOiJjanJ6cGZtd24xYmU0M3lxcmVhMDR2dWlqIn0.QQSWbd-riqn1U5ppmyQjRw" //not our token?

        const mapLayers: Array<MapLayer> = [
            {
//        attribution:
                //          '<a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
                baseLayerIsChecked: false,
                baseLayerName: 'OpenStreetMap',
                layerType: 'TileLayer',
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            }
        ]

        if(MapBoxAccessToken){
            mapLayers.push(
                {
//        attribution:
                    //          '<a href="https://mapbox.com">MapBox</a> contributors',
                    baseLayerIsChecked: true,
                    baseLayer: true,
                    baseLayerName: 'Mapbox',
                    layerType: 'TileLayer',
                    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=`+MapBoxAccessToken,
                },
            )
        }

        return mapLayers;
    }

    useEffect(() => {
        /**
        const getLocationAsync = async () => {

            let { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                console.warn('Permission to access location was denied')
            }

            let location = await Location.getCurrentPositionAsync({})
            if (!ownPosition) {
                setOwnPosition({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                })
            }
        }

        getLocationAsync().catch((error) => {
            console.error(error)
        })
         */
    }, [props])

    function renderMap(){
        return(
            <ExpoLeaflet
                loadingIndicator={() => <ActivityIndicator />}
                mapCenterPosition={mapCenterPosition}
                mapLayers={getMapLayers()}
                mapMarkers={mapMarkers}
                mapOptions={mapOptions}
                mapShapes={mapShapes}
                maxZoom={18}
                zoom={zoom}
                onMessage={(message) => {
                    //console.log(message)
                    if(!!message.zoom){
                        let nextZoomLevel = message.zoom;
                        nextZoomLevel = Math.round(parseFloat(nextZoomLevel));
                        setZoom(nextZoomLevel)
                    }

                    switch (message.tag) {
                        case 'onMapMarkerClicked':
                            Alert.alert(
                                `Map Marker Touched, ID: ${message.mapMarkerId || 'unknown'}`,
                            )
                            break
                        case 'onMapClicked':
                            handleClickedAt(message.location.lat, message.location.lng);
                            break
                        case 'onMoveEnd':
                            setMapCenterPosition(message.mapCenter)
                            break
                        case 'onZoomEnd':
                            if(!!message.zoom){
                                //setZoom(message.zoom)
                            }
                            break
                        default:
                            if (['onMove'].includes(message.tag)) {
                                return
                            }
                            //console.log(message)
                    }
                }}
            />
        )
    }

    let width = dimension?.width || "100%";
    let height = dimension?.height+Layout.padding || "100%";

    return (
        <View style={{height: height, width: width}}>
            <View style={{ flex: 1, position: 'relative' }}>
                {renderMap()}
                <View style={{position: "absolute", top: 0, left: 0, with: "80%"}}>
                    <Text>{"Clicked at: "+JSON.stringify(clickedPosition)}</Text>
                    <Text>{"mapCenterPosition: "+JSON.stringify(mapCenterPosition)}</Text>
                    <Text>{"zoom: "+zoom}</Text>
                    <Button
                        onPress={() => {
                            setZoom(7)
                            setMapCenterPosition(initialPosition)
                        }}
                        title="Reset Map"
                    />
                </View>
            </View>
        </View>
    )
}
