import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  serviceName: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#64748B",
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  infoRowLast: {
    marginBottom: 0,
  },

  infoLabel: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
    marginRight: 12,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  joinButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  joinButtonDisabled: {
    backgroundColor: "#94A3B8",
  },

  joinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  resultCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },

  tokenLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 6,
  },

  token: {
    fontSize: 36,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 22,
  },

  resultRow: {
    marginBottom: 16,
  },

  resultLabel: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },

  resultValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#B45309",
    marginTop: 16,
  },
});

export default styles;