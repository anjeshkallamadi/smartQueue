import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";
export default StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: SPACING.lg, backgroundColor: COLORS.background },
  title: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8, color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.sm },
  subtitle: { fontSize: TYPOGRAPHY.body, lineHeight: 25, color: COLORS.secondaryText, textAlign: "center", marginBottom: SPACING.xl, maxWidth: 300 },
  button: { width: "100%", height: 54, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: TYPOGRAPHY.body, fontWeight: "700", color: COLORS.surface },
});