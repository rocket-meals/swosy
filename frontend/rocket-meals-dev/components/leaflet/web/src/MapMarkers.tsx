import type {LatLngExpression, PointExpression} from 'leaflet'
import {DivIcon, divIcon} from 'leaflet'
import * as React from 'react'
import {LayerGroup, Marker, Popup} from 'react-leaflet'
// import MarkerClusterGroup from 'react-leaflet-markercluster'
// import 'react-leaflet-markercluster/dist/styles.min.css'
import {Dimensions, MapMarker as MapMarkerType} from './model'

// load the default marker icon 'leaflet/dist/images/marker-icon-2x.png'

export const MARKER_DEFAULT_SIZE = 48
export const getDefaultIconAnchor = (x: number, y: number): PointExpression => {
    return [6, y/2];
}

export const createDivIcon = (mapMarker: MapMarkerType): DivIcon => {
  const defaultSize = MARKER_DEFAULT_SIZE
  const [x, y]: Dimensions = mapMarker.size ?? [defaultSize, defaultSize]
  const defaultIconAnchor = getDefaultIconAnchor(x, y)
  let html: any = ""

  let iconAnchor = mapMarker.iconAnchor ?? defaultIconAnchor

  if(mapMarker?.icon){
    html = mapMarker.icon.includes('svg') || mapMarker.icon.includes('SVG')
            ? `<div style='font-size: ${Math.max(x, y)}px'>${mapMarker.icon}</div>`
            : mapMarker.icon.includes('//') && mapMarker.icon.includes('http')
                ? `<img src="${mapMarker.icon}" style="width:${x}px;height:${y}px;">`
                : mapMarker.icon.includes('base64')
                    ? `<img src="${mapMarker.icon}" style="width:${x}px;height:${y}px;">`
                    : `<div style='font-size: ${Math.max(x, y)}px'>${mapMarker.icon}</div>`
  }

  return divIcon({
    className: 'clearMarkerContainer',
    html: html,
    iconAnchor: iconAnchor,
  })
}

const MapMarker = ({
  mapMarker,
  onClick,
}: {
  mapMarker: MapMarkerType
  onClick: (markerId: string) => void
}) => {
  return (
    <Marker
      key={mapMarker.id}
      position={mapMarker.position as LatLngExpression}
      icon={createDivIcon(mapMarker)}
      eventHandlers={{
        click: () => {
          onClick(mapMarker.id)
        },
      }}
    >
      {mapMarker.title && <Popup>{mapMarker.title}</Popup>}
    </Marker>
  )
}

interface MapMarkersProps {
  mapMarkers: Array<MapMarkerType>
  onClick: (markerId: string) => void
  // maxClusterRadius?: number
}

export function MapMarkers(props: MapMarkersProps) {
  // const useMarkerClustering = props.maxClusterRadius == null
  // if (useMarkerClustering) {
  //   return (
  //     <LayerGroup>
  //       <MarkerClusterGroup maxClusterRadius={props.maxClusterRadius}>
  //         {props.mapMarkers.map((mapMarker: MapMarker) => {
  //           if (mapMarker.id === OwnPositionMarkerId) {
  //             return null
  //           }
  //           return (
  //             <MapMarker
  //               key={mapMarker.id}
  //               mapMarker={mapMarker}
  //               onClick={props.onClick}
  //             />
  //           )
  //         })}
  //       </MarkerClusterGroup>
  //       {props.mapMarkers.map((mapMarker: MapMarker) => {
  //         if (mapMarker.id === OwnPositionMarkerId) {
  //           return (
  //             <MapMarker
  //               key={mapMarker.id}
  //               mapMarker={mapMarker}
  //               onClick={props.onClick}
  //             />
  //           )
  //         } else {
  //           return null
  //         }
  //       })}
  //     </LayerGroup>
  //   )
  // } else {
  return (
    <LayerGroup>
      {props.mapMarkers.map((mapMarker: MapMarkerType) => {
        return (
          <MapMarker
            key={mapMarker.id}
            mapMarker={mapMarker}
            onClick={props.onClick}
          />
        )
      })}
    </LayerGroup>
  )
  // }
}
