import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import SmartQueueLogo from "../components/SmartQueueLogo";
import styles from "../../styles/welcomeStyles";

export default function Index() {
  return (
    <View style={styles.container}>
      <SmartQueueLogo size={142} />
      <Text style={styles.title}>
        Smart<Text style={{ color: "#2FA99D" }}>Queue</Text>
      </Text>
      <Text style={styles.subtitle}>
        Skip the line. Save your time.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/login")}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}
