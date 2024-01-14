import React from 'react';
import {Drawer} from 'expo-router/drawer';
import {StyleSheet} from 'react-native';
import {Text, View} from "@/components/Themed";

// Import your screen components

export function BottomRow() {
    return (
        <View style={styles.container}>
            <Text>Bottom Row Content</Text>
            {/* Add other UI elements and functionality here */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 50,
        backgroundColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
        // Add other styling as needed
    },
});

export default function AppLayout() {
    return (
        <Drawer>
            <Drawer.Screen
                name="home/index" // This is the name of the page and must match the url from root
                options={{
                    drawerLabel: 'Home',
                    title: 'Home',
                }}
            />
            <Drawer.Screen
                name="settings/index" // This is the name of the page and must match the url from root
                options={{
                    drawerLabel: 'Settings',
                    title: 'Settings',
                }}
            />
        </Drawer>
    );
}
