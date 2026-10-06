import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  serviceName: {
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 6,
  },

  serviceDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },

  joinButton: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  joinButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default styles;