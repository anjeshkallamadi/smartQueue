import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 30, flexGrow: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "bold", color: "#0F172A" },
  subtitle: { color: "#64748B", fontSize: 14, marginBottom: 24 },
  markAll: { color: "#2563EB", fontWeight: "600", fontSize: 13 },
  card: { flexDirection: "row", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, padding: 15, marginBottom: 12, gap: 12 },
  unreadCard: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  notificationContent: { flex: 1 },
  notificationTitle: { color: "#0F172A", fontSize: 16, fontWeight: "700", marginBottom: 5 },
  message: { fontSize: 14, lineHeight: 21, color: "#475569" },
  time: { fontSize: 12, color: "#64748B", marginTop: 8 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#2563EB", marginTop: 5 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 70 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", marginTop: 15, color: "#334155" },
  emptyMessage: { fontSize: 14, textAlign: "center", marginTop: 8, color: "#64748B" },
  errorText: { color: "#DC2626", textAlign: "center", marginVertical: 15 },
  retryText: { color: "#2563EB", fontWeight: "600", textAlign: "center", padding: 12 },
});
