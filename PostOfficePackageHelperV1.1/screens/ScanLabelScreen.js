import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button, Image, Alert } from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../apiConfig";

export function ScanLabelScreen() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [recognizedText, setRecognizedText] = useState(null);

  const askForCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  useEffect(() => {
    askForCameraPermission();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      navigation.navigate("Package Helper");

      const formData = new FormData();
      formData.append("imageUri", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "image.jpg",
      });

      fetch(`${API_BASE_URL}/recognize-text`, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then(async (data) => {
          const fullExtractedText = data.text;

          const startIndex = fullExtractedText.indexOf("TO:") + "TO:".length;
          const endIndex = fullExtractedText.indexOf("USPS TRACKING #");
          const extractedText =
            startIndex >= 0 && endIndex >= 0
              ? data.text.substring(startIndex, endIndex).trim()
              : "";

          if (extractedText) {
            const lines = extractedText.split("\n");

            if (lines.length >= 3) {
              const formattedData = {
                customerName: lines[0].trim(),
                addressOneAndTwo: lines[1].trim(),
                cityStateZip: lines[2].trim(),
              };

              console.log(formattedData)

              await AsyncStorage.setItem(
                "lastScannedData",
                JSON.stringify(formattedData)
              );

              // Make the API request to addressesByFormattedData
              const response = await fetch(
                `${API_BASE_URL}/addressesByFormattedData?fullAddress=${formattedData.addressOneAndTwo} ${formattedData.cityStateZip}`
              );

              if (response.ok) {
                const addressData = await response.json();
                console.log("Address Data:", addressData);
              } else {
                console.error("Error fetching address:", response.status);
              }
            } else {
              console.error("Invalid number of lines in extracted text.");
            }
          } else {
            console.error("No valid extracted text found.");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  };

  const cameraRef = React.useRef(null);

  const convertImageToBase64 = async (imageUri) => {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  };

  return (
    <View style={styles.container}>
      {hasPermission === false && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No access to camera</Text>
          <Button title={"Allow Camera"} onPress={askForCameraPermission} />
        </View>
      )}

      {hasPermission === true && !capturedImage && (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.cameraPreview}
            type={Camera.Constants.Type.back}
          />
          <Button title="Take Picture" onPress={takePicture} />
        </View>
      )}

      {capturedImage && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>Captured Image:</Text>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        </View>
      )}

      {recognizedText !== null && (
        <View style={styles.textRecognitionContainer}>
          <Text style={styles.textRecognitionText}>Recognized Text:</Text>
          <Text>Customer Name: {recognizedText.customerName}</Text>
          <Text>Address: {recognizedText.addressOneAndTwo}</Text>
          <Text>City, State, Zip: {recognizedText.cityStateZip}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  permissionText: {
    margin: 10,
  },
  cameraContainer: {
    flex: 1,
    width: "100%",
  },
  cameraPreview: {
    flex: 1,
  },
  previewContainer: {
    alignItems: "center",
  },
  previewText: {
    fontSize: 16,
    margin: 20,
  },
  capturedImage: {
    width: 300,
    height: 400,
    resizeMode: "contain",
  },
  textRecognitionContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  textRecognitionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
