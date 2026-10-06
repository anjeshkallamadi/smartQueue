import { Text, View } from "react-native";
import styles from "../../styles/activeQueueCardStyles";

export default function ActiveQueueCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>No active queue</Text>

      <Text style={styles.text}>
        You are not currently waiting in any queue.
        Join a service below to get started "frontend Anjesh".
      </Text>
    </View>
  );
}