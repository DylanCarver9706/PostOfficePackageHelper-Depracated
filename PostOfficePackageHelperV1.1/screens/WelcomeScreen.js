import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function WelcomeScreen() {
  const navigation = useNavigation();

  const handleNextPage = () => {
    navigation.navigate("Signup Screen");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome to Postal Parcel Helper!This app will help carriers at the post
        office keep track of their packages that need to be delivered. This will
        reduce misdeliveries, save time on backtracks, and provide more peace of
        mind while performing one of the hardest jobs in the world!
      </Text>
      <Button title="Let's Get Started!" onPress={handleNextPage}></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
