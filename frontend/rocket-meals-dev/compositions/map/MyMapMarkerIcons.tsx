export const MARKER_DEFAULT_SIZE = 48


export class MyMapMarkerIcons{
	// string with a div. A rectangle with color #FF000066 and on top of that a circle with color #00FF0066 no border colors. use MARKER_DEFAULT_SIZE for width and height
	static DEBUG_ICON = "<div style='width: "+MARKER_DEFAULT_SIZE+"px; height: "+MARKER_DEFAULT_SIZE+"px; background-color: #FF000066; position: relative;'><div style='width: "+MARKER_DEFAULT_SIZE+"px; height: "+MARKER_DEFAULT_SIZE+"px; background-color: #00FF0066; border-radius: 50%; position: absolute; top: 0%; left: 0%;'></div></div>"

	static getIconForWebByUri(iconUri: string): string{
		return "<img src='"+iconUri+"' style='width: "+MARKER_DEFAULT_SIZE+"px; height: "+MARKER_DEFAULT_SIZE+"px; object-fit: contain;'>";
	}
}