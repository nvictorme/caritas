import {
  Camera,
  CameraPermissionStatus,
  useCameraDevices,
  useFrameProcessor,
} from "react-native-vision-camera";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useEffect, useMemo, useState } from "react";

export default function HomeScreen() {
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>();
  const [isFrontCamera, setIsFrontCamera] = useState(false);

  const devices = useCameraDevices();
  const { frontCamera, backCamera } = useMemo(
    () => ({
      frontCamera: devices.find((device) => device.position === "front"),
      backCamera: devices.find((device) => device.position === "back"),
    }),
    [devices]
  );
  const device = isFrontCamera ? frontCamera : backCamera;

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    console.log(
      new Date().toISOString(),
      `Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`
    );
  }, []);

  useEffect(() => {
    // Request camera permissions when component mounts
    Camera.requestCameraPermission().then(setCameraPermission);
  }, []);

  if (cameraPermission !== "granted") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please grant camera permission</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => setIsFrontCamera(!isFrontCamera)}
      >
        <Text style={styles.switchButtonText}>Switch Camera</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  switchButton: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    borderRadius: 8,
  },
  switchButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
