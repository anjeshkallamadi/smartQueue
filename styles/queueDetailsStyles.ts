import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  serviceName: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },

  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 15,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },

  joinButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  joinButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },

  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },

  tokenLabel: {
    fontSize: 15,
    marginBottom: 6,
  },

  token: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 20,
  },

  resultRow: {
    marginBottom: 14,
  },

  resultLabel: {
    fontSize: 14,
    marginBottom: 4,
  },

  resultValue: {
    fontSize: 18,
    fontWeight: "600",
  },
});

export default styles;