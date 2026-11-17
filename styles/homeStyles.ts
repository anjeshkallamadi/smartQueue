import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";
export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: 30 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.lg },
  logoText: { fontSize: 23, fontWeight: "800", color: COLORS.primaryDark },
  profileButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  greeting: { fontSize: TYPOGRAPHY.body, color: COLORS.secondaryText, marginBottom: 6 },
  title: { fontSize: 27, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.lg },
  adminButton: { backgroundColor: COLORS.teal, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  adminButtonText: { color: COLORS.surface, fontSize: TYPOGRAPHY.body, fontWeight: "700" },
  searchInput: { height: 52, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg, color: COLORS.text },
  sectionTitle: { fontSize: TYPOGRAPHY.heading, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md },
  errorText: { color: COLORS.danger, marginBottom: 12 },
  emptyText: { color: COLORS.secondaryText, marginBottom: 16 },
});