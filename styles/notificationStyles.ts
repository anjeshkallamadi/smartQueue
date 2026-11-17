import { useAppTheme } from "../src/context/ThemeContext";
import { StyleSheet } from "react-native";

export function useNotificationStyles(){const {colors:COLORS}=useAppTheme();return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 30, flexGrow: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "bold", color: COLORS.text },
  subtitle: { color: COLORS.secondaryText, fontSize: 14, marginBottom: 24 },
  markAll: { color: COLORS.primaryDark, fontWeight: "600", fontSize: 13 },
  card: { flexDirection: "row", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 15, marginBottom: 12, gap: 12 },
  unreadCard: { backgroundColor: COLORS.softBlue, borderColor: COLORS.border },
  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.softBlue, alignItems: "center", justifyContent: "center" },
  notificationContent: { flex: 1 },
  notificationTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 5 },
  message: { fontSize: 14, lineHeight: 21, color: COLORS.secondaryText },
  time: { fontSize: 12, color: COLORS.secondaryText, marginTop: 8 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#2563EB", marginTop: 5 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 70 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", marginTop: 15, color: COLORS.text },
  emptyMessage: { fontSize: 14, textAlign: "center", marginTop: 8, color: COLORS.secondaryText },
  errorText: { color: COLORS.danger, textAlign: "center", marginVertical: 15 },
  retryText: { color: COLORS.primaryDark, fontWeight: "600", textAlign: "center", padding: 12 },
});}
