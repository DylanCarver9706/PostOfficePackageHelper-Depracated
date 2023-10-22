import React from 'react';
import { View, Text, FlatList } from 'react-native';

// Dummy data for addresses
const dummyAddresses = [
  { id: 1, address: '123 Main St, City 1, State 1, Zip 1' },
  { id: 2, address: '456 Elm St, City 2, State 2, Zip 2' },
  { id: 3, address: '789 Oak St, City 3, State 3, Zip 3' },
  // Add more addresses as needed
];

export function AddressesScreen({ route }) {
  // Extract the selected case row number from the route params
  const { caseRowNumber } = route.params;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Addresses for Row {caseRowNumber}</Text>
      <FlatList
        data={dummyAddresses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10 }}>
            <Text>{item.address}</Text>
          </View>
        )}
      />
    </View>
  );
}