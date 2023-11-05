import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button, Image, Alert } from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system"; // Import FileSystem
import { NativeModules } from "react-native";

export function ScanLabelScreen() {
  NativeModules.ActualModuleName;
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

      // Create a FormData object to send as multipart/form-data
      const formData = new FormData();
      formData.append("imageUri", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "image.jpg",
      });

      // Send a POST request to your server with the FormData
      fetch("https://cb66-71-85-245-93.ngrok-free.app/api/recognize-text", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Handle the response from the server
          fullExtractedText = data.text;
          console.log(fullExtractedText);

          // Extract text between "TO:" and "USPS TRACKING #"
          const startIndex = fullExtractedText.indexOf("TO:") + "TO:".length;
          const endIndex = fullExtractedText.indexOf("USPS TRACKING #");
          const extractedText = data.text
            .substring(startIndex, endIndex)
            .trim();
          console.log("Extracted Text:", extractedText);

          // Split the extracted text into lines
          const lines = extractedText.split("\n");

          // Create an object with formatted lines
          const formattedData = {
            customerName: lines[0].trim(),
            addressOneAndTwo: lines[1].trim(),
            cityStateZip: lines[2].trim(),
          };

          console.log("Formatted Data:", formattedData);

          // Update the recognizedText state
          // setRecognizedText(formattedData);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  };

  const cameraRef = React.useRef(null);

  // Function to convert image to base64
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
          <Text>{recognizedText}</Text>
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
