import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useWelcomeStyles } from "../../styles/welcomeStyles";
import { useAppTheme } from "../context/ThemeContext";
import SmartQueueLogo from "../components/SmartQueueLogo";

export default function Index() {
  const styles = useWelcomeStyles();
  const {colors}=useAppTheme();
  return (
    <View style={styles.container}>
      <SmartQueueLogo size={132} />
      <Text style={styles.title}>SmartQueue</Text>
      <Text style={styles.subtitle}>Skip the line. Save your time.</Text>
      <Pressable style={styles.button} onPress={() => router.push("/login")}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>
    </View>
  );
}