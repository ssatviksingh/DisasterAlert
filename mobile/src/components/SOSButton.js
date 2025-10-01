import React from 'react';
import { Pressable, Text, Alert } from 'react-native';

export default function SOSButton({ onSend }) {
    return (
        <Pressable
            onLongPress={() =>
                Alert.alert('Confirm SOS', 'Send SOS now?', [
                    { text: 'Cancel' },
                    { text: 'Send', onPress: onSend }
                ])
            }
            style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: 'red',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>SOS</Text>
        </Pressable>
    );
}
