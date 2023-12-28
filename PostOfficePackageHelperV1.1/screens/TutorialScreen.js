import React, { useState } from "react";
import { View, Image, Button, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

const tutorialContent = [
  {
    image: require("../assets/demo1-image.png"),
  },
  {
    image: require("../assets/demo2-image.png"),
  },
  {
    image: require("../assets/demo3-image.png"),
  },
  {
    image: require("../assets/demo-4-image.png"),
  },
];

export function TutorialScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const navigation = useNavigation();

  const handleNextSlide = () => {
    // Increment the current slide index
    setCurrentSlide(currentSlide + 1);
  };

  const handlePreviousSlide = () => {
    // Decrement the current slide index
    setCurrentSlide(currentSlide - 1);
  };

  const handleFinishTutorial = () => {
    // Navigate to the next screen (e.g., HomeScreen) when the tutorial is finished
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <Image
        source={tutorialContent[currentSlide].image}
        style={styles.image}
      />
      <Button
        title="Back"
        onPress={handlePreviousSlide}
        disabled={currentSlide === 0}
      />
      <Button
        title={currentSlide === tutorialContent.length - 1 ? "Finish" : "Next"}
        onPress={
          currentSlide === tutorialContent.length - 1
            ? handleFinishTutorial
            : handleNextSlide
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: "contain",
  },
});
