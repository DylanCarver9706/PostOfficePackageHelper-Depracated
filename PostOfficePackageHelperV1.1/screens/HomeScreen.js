import React from 'react';
import { View, Text, Button, LogBox } from 'react-native';

// Import the necessary modules for handling authentication and navigation
import AsyncStorage from '@react-native-async-storage/async-storage'; // For storing user data
import { useNavigation } from '@react-navigation/native'; // For navigation

// Define the HomeScreen component
export function HomeScreen({ setUser }) {
  const navigation = useNavigation();

  // Define the handleLogout function
  const handleLogout = async () => {
    // Perform any necessary cleanup (e.g., clearing user data from AsyncStorage)
    try {
      await AsyncStorage.clear(); // Clear user data from AsyncStorage
  
      // Send a request to the /api/logout endpoint
      const response = await fetch('https://4beb-71-85-245-93.ngrok-free.app/api/logout', {
        method: 'GET', // You can adjust the HTTP method as needed
      });
  
      if (response.ok) {
        // Set the user state to null upon successful logout
        setUser(null);
  
        // Force a full app reload if the logout was successful
        LogBox.ignoreAllLogs(); // Ignore warnings to prevent errors during reload
        navigation.replace('HaveAccountScreen');
      } else {
        // Handle the case where logout fails
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      // Handle any errors that occur during the logout process
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button
        title="Case Builder"
        onPress={() => navigation.navigate('Select Office Route')}
      />
      <Button
        title="Package Helper"
        onPress={() => navigation.navigate('Package Helper')}
      />
      <Button
        title="Logout"
        onPress={handleLogout} // Call the handleLogout function when the button is pressed
      />
    </View>
  );
}
