import React from "react";
import {Text} from "@/components/Themed";
import {useProjectColor} from "@/states/ProjectInfo";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";

/**
 * Defines the required properties for a drawer item label component.
 *
 * @prop {string} color - The text color of the label.
 * @prop {boolean} focused - Whether the associated drawer item is currently focused.
 */
export type RequiredDrawerItemLabelProps = {
    color: string,
    focused: boolean
}

/**
 * Extends RequiredDrawerItemLabelProps with a custom property for specifying the label text.
 *
 * @prop {string | undefined} label - The text content of the label. Can be undefined to support dynamic label texts.
 */
export type MyCustomDrawerItemLabelProps = {
    label: string | undefined,
} & RequiredDrawerItemLabelProps

/**
 * Factory function to create a React component for rendering a custom drawer item label.
 *
 * @param {string | undefined} label - The text content for the label. Can be undefined for dynamic label assignment.
 * @returns A function that takes RequiredDrawerItemLabelProps and returns a JSX.Element representing the custom label.
 */
export const getMyDrawerItemLabel = (label: string | undefined) => {
    return (props: RequiredDrawerItemLabelProps) => (
        <MyDrawerItemLabel label={label} {...props} />
    );
}

/**
 * Component for rendering a custom drawer item label.
 * This component adjusts the label's color based on the item's focus state, using project-specific color schemes.
 *
 * @param {MyCustomDrawerItemLabelProps} props - The combined props including label text and required label properties.
 * @returns A JSX.Element representing the custom label, styled based on focus state.
 */
export const MyDrawerItemLabel = ({ focused, color, label }: MyCustomDrawerItemLabelProps) => {
    let projectColor = useProjectColor(); // Fetch the current project color for theme consistency.
    let contrastColor = useMyContrastColor(projectColor); // Calculate a contrasting color based on the project color for better visibility.

    // Render the label within a Text component, dynamically adjusting its color based on the focus state.
    return (
        <Text style={{ color: focused ? contrastColor : color }}>{label}</Text>
    );
}
