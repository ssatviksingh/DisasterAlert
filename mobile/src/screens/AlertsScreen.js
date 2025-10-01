import React from 'react';
import { View, Text, Button } from 'react-native';

export default function AlertsScreen({ navigation }) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Alerts will appear here</Text>
            <Button
                title="Go to SOS"
                onPress={() => navigation.navigate('SOS')}
            />
        </View>
    );
}
