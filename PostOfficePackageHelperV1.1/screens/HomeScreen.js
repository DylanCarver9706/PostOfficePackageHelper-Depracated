import React from 'react';
import { View, Text, Button } from 'react-native';

export function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button
        title="Case Builder"
        onPress={() => navigation.navigate('Case Builder')}
      />
      <Button
        title="Package Helper"
        onPress={() => navigation.navigate('Package Helper')}
      />
    </View>
  );
}
