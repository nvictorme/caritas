import {
  Camera,
  CameraPermissionStatus,
  useCameraDevices,
  useFrameProcessor,
  runAsync,
} from "react-native-vision-camera";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import Animated from "react-native-reanimated";

import {
  Face,
  useFaceDetector,
  FaceDetectionOptions,
} from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";

export default function HomeScreen() {
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>();
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [faces, setFaces] = useState<Face[]>([]);
  const [cameraLayout, setCameraLayout] = useState({
    width: 0,
    height: 0,
  });

  const devices = useCameraDevices();
  const { frontCamera, backCamera } = useMemo(
    () => ({
      frontCamera: devices.find((device) => device.position === "front"),
      backCamera: devices.find((device) => device.position === "back"),
    }),
    [devices]
  );
  const device = isFrontCamera ? frontCamera : backCamera;

  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    // detection options
  }).current;
  const { detectFaces } = useFaceDetector(faceDetectionOptions);

  const handleDetectedFaces = Worklets.createRunOnJS(
    (detectedFaces: Face[]) => {
      setFaces(detectedFaces);
    }
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const faces = detectFaces(frame);
      handleDetectedFaces(faces);
    },
    [handleDetectedFaces]
  );

  useEffect(() => {
    // Request camera permissions when component mounts
    Camera.requestCameraPermission().then(setCameraPermission);
  }, []);

  const createAnimatedStyle = (face: Face) => {
    const scaleX = cameraLayout.width;
    const baseSize = Platform.select({
      ios: ((face.bounds.width / 1080) * scaleX) / 2,
      android: (face.bounds.width / 1080) * scaleX * 2, // Doubled size for Android
    });

    return {
      position: "absolute",
      width: baseSize,
      height: baseSize * 1.3,
      borderWidth: 2,
      borderColor: "#00ff00",
      borderRadius: baseSize,
      backgroundColor: "transparent",
    };
  };

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
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}
      />
      {faces.map((face, index) => {
        const scaleX = cameraLayout.width;
        const x = Platform.select({
          ios: ((face.bounds.x / 1080) * scaleX) / 2,
          android: (face.bounds.x / 1080) * scaleX * 0.5, // Adjusted for centering
        });
        const y = Platform.select({
          ios: ((face.bounds.y / 1080) * scaleX) / 2 + 100,
          android: (face.bounds.y / 1080) * scaleX * 0.5, // Adjusted for centering
        });
        const faceWidth = Platform.select({
          ios: ((face.bounds.width / 1080) * scaleX) / 2,
          android: (face.bounds.width / 1080) * scaleX * 2,
        });
        const faceHeight = Platform.select({
          ios: ((face.bounds.height / 1080) * scaleX) / 2,
          android: (face.bounds.height / 1080) * scaleX * 2,
        });
        const ovalWidth = Platform.select({
          ios: ((face.bounds.width / 1080) * scaleX) / 2,
          android: (face.bounds.width / 1080) * scaleX * 2,
        });
        const ovalHeight = ovalWidth * 1.3;

        // Add some console.log to help debug positioning
        if (Platform.OS === "android") {
          console.log("Face bounds:", face.bounds);
          console.log("Calculated position:", { x, y });
          console.log("Screen size:", {
            width: cameraLayout.width,
            height: cameraLayout.height,
          });
        }

        return (
          <Animated.View
            key={index}
            style={[
              createAnimatedStyle(face),
              {
                left: x + faceWidth / 2 - ovalWidth / 2,
                top: y + faceHeight / 2 - ovalHeight / 2,
              },
            ]}
          />
        );
      })}
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
