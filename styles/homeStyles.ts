import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2563EB",
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: { fontSize: 16, marginBottom: 6 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  adminButton: {
    backgroundColor: "#0F766E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  adminButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  scanButton: {
    borderRadius: 12,
    backgroundColor: "#1D4ED8",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 18,
  },
  scanButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  errorText: { color: "#DC2626", marginBottom: 12 },
  emptyText: { marginBottom: 16 },
});

export default styles;
