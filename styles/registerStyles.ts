import { useAppTheme } from "../src/context/ThemeContext";
import { StyleSheet } from "react-native";
import { RADIUS, SPACING, TYPOGRAPHY } from "./theme";
export function useRegisterStyles(){const {colors:COLORS}=useAppTheme();return StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.lg, justifyContent: "center", backgroundColor: COLORS.background },
  title: { fontSize: TYPOGRAPHY.title, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: TYPOGRAPHY.body, color: COLORS.secondaryText, marginBottom: SPACING.xl },
  input: { height: 54, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, marginBottom: SPACING.md, color: COLORS.text },
  button: { height: 54, borderRadius: RADIUS.lg, backgroundColor: "#286DB7", alignItems: "center", justifyContent: "center", marginTop: SPACING.sm },
  buttonText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  loginText: { textAlign: "center", marginTop: SPACING.lg, color: COLORS.primaryDark, fontWeight: "600" },
});}
