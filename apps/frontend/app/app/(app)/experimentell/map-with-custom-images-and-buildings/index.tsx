import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MyMap from '@/components/MyMap';
import { MyMapHandle } from '@/components/MyMap/MyMapHelper';
import useSetPageTitle from '@/hooks/useSetPageTitle';

// Demo center: FAU Erlangen campus area
const DEMO_CENTER = { lat: 49.5977, lng: 11.0036 };
const DEMO_ZOOM = 17;
const DEMO_PITCH = 55;

/**
 * Image overlay: 200 m × 200 m rectangle centered on demo location.
 * Coordinates order: top-left, top-right, bottom-right, bottom-left (MapLibre image source format).
 */
const IMAGE_OVERLAYS = [
    {
        id: 'pexels-overlay',
        url: 'https://images.pexels.com/photos/6071708/pexels-photo-6071708.jpeg',
        coordinates: [
            [11.00221, 49.59860],
            [11.00499, 49.59860],
            [11.00499, 49.59680],
            [11.00221, 49.59680],
        ],
        opacity: 0.8,
    },
];

/**
 * 3D buildings (simple box extrusions).
 * Each entry needs a closed polygon ring + height in meters + color.
 */
const BUILDINGS_3D = [
    {
        id: 'cube-orange',
        coordinates: [
            [11.00412, 49.59848],
            [11.00468, 49.59848],
            [11.00468, 49.59812],
            [11.00412, 49.59812],
        ],
        height: 15,
        base: 0,
        color: '#ff6600',
        opacity: 0.9,
    },
    {
        id: 'cube-blue',
        coordinates: [
            [11.00269, 49.59747],
            [11.00311, 49.59747],
            [11.00311, 49.59693],
            [11.00269, 49.59693],
        ],
        height: 25,
        base: 0,
        color: '#1565c0',
        opacity: 0.9,
    },
    {
        id: 'tower-red',
        coordinates: [
            [11.00446, 49.59759],
            [11.00474, 49.59759],
            [11.00474, 49.59741],
            [11.00446, 49.59741],
        ],
        height: 50,
        base: 0,
        color: '#c62828',
        opacity: 0.85,
    },
];

const MapWithCustomImagesAndBuildings = () => {
    useSetPageTitle('Map – Custom Images & Buildings');

    const mapRef = useRef<MyMapHandle>(null);

    const handleMessage = useCallback((data: object) => {
        const msg = data as { tag?: string };
        if (msg.tag === 'MapComponentMounted') {
            mapRef.current?.sendToMap({
                mapCenterPosition: DEMO_CENTER,
                zoom: DEMO_ZOOM,
                pitch: DEMO_PITCH,
                animate: false,
                imageOverlays: IMAGE_OVERLAYS,
                buildings3d: BUILDINGS_3D,
            });
        }
    }, []);

    return (
        <View style={styles.container}>
            <MyMap
                ref={mapRef}
                initialCenter={DEMO_CENTER}
                initialPitch={DEMO_PITCH}
                loadingText="Loading map…"
                onMessage={handleMessage}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default MapWithCustomImagesAndBuildings;
