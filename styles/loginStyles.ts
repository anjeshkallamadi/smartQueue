import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "./theme";
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: "center", backgroundColor: COLORS.background },
  title: { fontSize: TYPOGRAPHY.title, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: TYPOGRAPHY.body, color: COLORS.secondaryText, marginBottom: SPACING.xl },
  input: { height: 54, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.md, color: COLORS.text },
  button: { height: 54, borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginTop: SPACING.sm },
  buttonText: { fontSize: 17, fontWeight: "700", color: COLORS.surface },
  registerText: { textAlign: "center", marginTop: SPACING.lg, color: COLORS.primaryDark, fontWeight: "600" },
});
export default styles;