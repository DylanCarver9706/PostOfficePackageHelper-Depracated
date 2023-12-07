import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button, Dimensions, ActivityIndicator } from "react-native";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../apiConfig";

const { width, height } = Dimensions.get("window");

export function ScanLabelScreen() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
      
      
      // Save the captured image to the device's media library
      // MediaLibrary.createAssetAsync(photo.uri);
      
      const formData = new FormData();
      formData.append("imageUri", {
        uri: photo.uri,
        type: "image/jpeg",
        name: "image.jpg",
      });
      console.log("text extraction started...")
      setIsLoading(true);
      fetch(`${API_BASE_URL}/recognize-image-objects`, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then(async (data) => {
          setIsLoading(false);
          navigation.navigate("Package Helper");
          const fullExtractedText = data.text;

          if (fullExtractedText) {
            console.log("formatted data: \n" + fullExtractedText);

            await AsyncStorage.setItem(
              "lastScannedData",
              JSON.stringify(fullExtractedText)
            );

            // Make the API request to addressesByFormattedData
            if (fullExtractedText.address2 !== "") {
              requestUrl = `${API_BASE_URL}/addressesByFormattedData?fullAddress=${fullExtractedText.address1} ${fullExtractedText.address2} ${fullExtractedText.city} ${fullExtractedText.state} ${fullExtractedText.zip_code}`;
            } else {
              requestUrl = `${API_BASE_URL}/addressesByFormattedData?fullAddress=${fullExtractedText.address1} ${fullExtractedText.city} ${fullExtractedText.state} ${fullExtractedText.zip_code}`;
            }
            console.log(requestUrl);
            const response = await fetch(requestUrl);

            if (response.ok) {
              const addressData = await response.json();
              console.log("Address Found: \n", addressData);
            } else {
              console.error("Error fetching address:", response.status);
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

  return (
    <View style={styles.container}>
      {hasPermission === false && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>No access to camera</Text>
          <Button title={"Allow Camera"} onPress={askForCameraPermission} />
        </View>
      )}
  
      {hasPermission === true ? (
        isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.cameraPreview}
              type={Camera.Constants.Type.back}
            >
              {/* Mask Overlay */}
              <View style={styles.maskOverlay}>
                <View style={styles.maskCenter}>
                  <View style={[styles.maskFrame, styles.maskCenterFrame]} />
                </View>
              </View>
            </Camera>
            <Button title="Take Picture" onPress={takePicture} />
          </View>
        )
      ) : null}
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
  textRecognitionContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  textRecognitionText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  maskOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  maskCenter: {
    flexDirection: "row",
  },
  maskCenterFrame: {
    width: width - 150,
    height: height / 1.55,
    borderColor: "red",
    borderWidth: 5,
  },
});
