import { useEffect } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import styles from "../../styles/welcomeStyles";

export default function Index() {
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/home");
      }
    };

    checkSession();
  }, []);

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