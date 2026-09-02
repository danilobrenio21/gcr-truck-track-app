import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Header from '../components/Header';
import DeliveryCard from '../components/DeliveryCard';
import { ACTIVE_DELIVERIES } from '../services/mockData';
import { COLORS } from '../constants/theme';

export default function DashboardScreen({ onSelectDelivery }) {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Active Fleet Dispatches</Text>
        <FlatList
          data={ACTIVE_DELIVERIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DeliveryCard delivery={item} onSelect={onSelectDelivery} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.slateDark, marginBottom: 16 },
});
