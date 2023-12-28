import React from 'react';
import { View, Text, Button } from 'react-native';

export function HaveAccountScreen({ navigation }) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Login or Signup</Text>
        <Button
          title="Login"
          onPress={() => navigation.navigate('Login Screen')}
        />
        <Button
          title="Signup"
          onPress={() => navigation.navigate('Welcome Screen')}
        />
      </View>
    );
  }