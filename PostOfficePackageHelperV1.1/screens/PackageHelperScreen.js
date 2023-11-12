import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";

export function PackageHelperScreen() {  
    const navigation = useNavigation();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Package Helper Screen</Text>
      <Button
        title="Scan Label"
        onPress={() => {
          navigation.navigate("Scan Label");
        }}
      />
    </View>
  );
}
