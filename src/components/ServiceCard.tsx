import { Text, View, Pressable } from "react-native";
import styles from "../../styles/serviceCardStyles";

type ServiceCardProps = {
  name: string;
  description: string;
  onPress: () => void;
};

export default function ServiceCard({
  name,
  description,
  onPress,
}: ServiceCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.serviceName}>{name}</Text>

      <Text style={styles.serviceDescription}>
        {description}
      </Text>

      <Pressable
        style={styles.joinButton}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View queue for ${name}`}
      >
        <Text style={styles.joinButtonText}>
          View Queue
        </Text>
      </Pressable>
    </View>
  );
}