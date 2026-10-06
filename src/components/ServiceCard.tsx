import { Text, View, Pressable } from "react-native";
import styles from "../../styles/serviceCardStyles";

type ServiceCardProps = {
  name: string;
  description: string;
};

export default function ServiceCard({
  name,
  description,
}: ServiceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.serviceName}>{name}</Text>

      <Text style={styles.serviceDescription}>
        {description}
      </Text>

      <Pressable style={styles.joinButton}>
        <Text style={styles.joinButtonText}>
          Join Queue
        </Text>
      </Pressable>
    </View>
  );
}