import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";

const AUDIO_FILE_EXTENSION = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;

function isAudioFile(asset: DocumentPicker.DocumentPickerAsset) {
  return (
    asset.mimeType?.startsWith("audio/") ||
    AUDIO_FILE_EXTENSION.test(asset.name)
  );
}

function formatFileSize(size?: number) {
  if (size === undefined) return "Size unavailable";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProcessScreen() {
  const [selectedAsset, setSelectedAsset] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const chooseAudio = async () => {
    setIsPicking(true);
    setErrorMessage(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset || !isAudioFile(asset)) {
        setErrorMessage(
          "Choose an MP3, WAV, M4A, AAC, OGG, or FLAC audio file.",
        );
        return;
      }

      setSelectedAsset(asset);
    } catch {
      setErrorMessage(
        "The audio picker could not be opened. Please try again.",
      );
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Sinhala audio upload" />
      <Text style={styles.description}>
        Choose a Sinhala song or recording to prepare it for a learning session.
      </Text>

      <Pressable
        accessibilityRole="button"
        disabled={isPicking}
        onPress={chooseAudio}
        style={({ pressed }) => [
          styles.chooseButton,
          pressed && styles.pressed,
          isPicking && styles.disabled,
        ]}
      >
        <Text style={styles.chooseButtonText}>
          {isPicking ? "Opening audio picker..." : "Choose audio file"}
        </Text>
      </Pressable>

      {errorMessage && (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      )}

      {selectedAsset && (
        <View style={styles.selectedFile}>
          <View style={styles.fileDetails}>
            <Text numberOfLines={1} style={styles.fileName}>
              {selectedAsset.name}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(selectedAsset.size)}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Remove selected audio"
            accessibilityRole="button"
            onPress={() => setSelectedAsset(null)}
            style={styles.removeButton}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.note}>
        {selectedAsset
          ? "Audio selected. Processing will be available when the service is connected."
          : "Supported formats: MP3, WAV, M4A, AAC, OGG, and FLAC."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  description: {
    color: "#60646C",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  chooseButton: {
    alignItems: "center",
    backgroundColor: "#176B5B",
    borderRadius: 8,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  chooseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: "#B42318",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  selectedFile: {
    alignItems: "center",
    borderColor: "#D7DEDC",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 20,
    padding: 16,
  },
  fileDetails: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    color: "#17211F",
    fontSize: 15,
    fontWeight: "600",
  },
  fileSize: {
    color: "#60646C",
    fontSize: 13,
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "600",
  },
  note: {
    color: "#60646C",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
});
