import React from 'react';
import { View, Text, Alert } from 'react-native';
import SOSButton from '../components/SOSButton';

export default function SOSScreen() {

    const sendSOS = async () => {
        const payload = {
            title: 'SOS from mobile',
            description: 'Need help',
            location: { coordinates: [0, 0] } // we’ll add real geolocation later
        };

        try {
            const res = await fetch('http://YOUR_COMPUTER_IP:4000/sos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.ok) Alert.alert('SOS sent!', `ID: ${data.sos._id}`);
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <SOSButton onSend={sendSOS} />
            <Text style={{ marginTop: 20 }}>Long-press the button to send SOS</Text>
        </View>
    );
}
