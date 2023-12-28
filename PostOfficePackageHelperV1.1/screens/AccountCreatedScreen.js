import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function AccountCreatedScreen() {
  const navigation = useNavigation();

  const handleNextPage = () => {
    navigation.navigate("Tutorial Screen");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.messageText}>Your account has been created!</Text>
      <Button title="Next" onPress={handleNextPage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
});
