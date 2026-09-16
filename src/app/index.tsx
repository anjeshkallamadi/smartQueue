import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import styles from "../../styles/welcomeStyles";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartQueue</Text>

      <Text style={styles.subtitle}>
        Skip the line. Save your time.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}