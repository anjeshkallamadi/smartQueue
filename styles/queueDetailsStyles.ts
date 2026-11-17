import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";
export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  serviceName: { fontSize: 30, lineHeight: 37, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.sm },
  description: { fontSize: 15, lineHeight: 23, color: COLORS.secondaryText, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: TYPOGRAPHY.heading, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md },
  infoCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  infoRowLast: { marginBottom: 0 },
  infoLabel: { fontSize: TYPOGRAPHY.small, color: COLORS.secondaryText, flex: 1, marginRight: 12 },
  infoValue: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  joinButton: { height: 54, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginTop: SPACING.sm },
  joinButtonDisabled: { backgroundColor: "#B7C7D8" },
  joinButtonText: { fontSize: TYPOGRAPHY.body, fontWeight: "700", color: COLORS.surface },
  resultCard: { backgroundColor: COLORS.softBlue, borderWidth: 1, borderColor: "#CFE5FA", borderRadius: RADIUS.xl, padding: 20, marginTop: SPACING.lg },
  tokenLabel: { fontSize: TYPOGRAPHY.small, color: COLORS.secondaryText, marginBottom: 6 },
  token: { fontSize: 38, fontWeight: "800", color: COLORS.primary, marginBottom: SPACING.lg },
  resultRow: { marginBottom: SPACING.md },
  resultLabel: { fontSize: TYPOGRAPHY.small, color: COLORS.secondaryText, marginBottom: 4 },
  resultValue: { fontSize: TYPOGRAPHY.body, fontWeight: "700", color: COLORS.text },
  message: { fontSize: TYPOGRAPHY.small, lineHeight: 21, color: "#A86B18", marginTop: SPACING.md },
});