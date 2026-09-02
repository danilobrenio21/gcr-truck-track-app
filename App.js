import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';
import LiveMapScreen from './src/screens/LiveMapScreen';

export default function App() {
  const [activeDelivery, setActiveDelivery] = useState(null);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {activeDelivery ? (
        <LiveMapScreen
          delivery={activeDelivery}
          onBack={() => setActiveDelivery(null)}
        />
      ) : (
        <DashboardScreen onSelectDelivery={(item) => setActiveDelivery(item)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
});
