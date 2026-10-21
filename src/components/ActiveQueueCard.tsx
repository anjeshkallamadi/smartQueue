
import { Text, View } from "react-native";
import styles from "../../styles/activeQueueCardStyles";
import {
  formatQueueToken,
  type MyActiveQueue,
} from "../services/supabaseQueueService";

interface ActiveQueueCardProps {
  queue: MyActiveQueue | null;
  loading: boolean;
  error: string | null;
}

export default function ActiveQueueCard({
  queue,
  loading,
  error,
}: ActiveQueueCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>My Active Queue</Text>

      {loading ? (
        <Text style={styles.text}>Loading your active queue...</Text>
      ) : error ? (
        <Text style={styles.text}>{error}</Text>
      ) : !queue ? (
        <Text style={styles.text}>
          You are not currently waiting in any queue.
          {"\n"}Join a service below to get started.
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            Service: {queue.serviceName}
          </Text>
          <Text style={styles.text}>
            Your token: {formatQueueToken(queue.tokenNumber)}
          </Text>
          <Text style={styles.text}>
            Status: {queue.status}
          </Text>
          <Text style={styles.text}>
            People ahead: {queue.peopleAhead}
          </Text>
          <Text style={styles.text}>
            Estimated wait:{" "}
            {queue.estimatedWaitMinutes == null
              ? "Not available"
              : `${queue.estimatedWaitMinutes} minutes`}
          </Text>
        </>
      )}
    </View>
  );
}
