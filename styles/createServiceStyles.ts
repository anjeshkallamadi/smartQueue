import { useAppTheme } from "../src/context/ThemeContext";
import { StyleSheet } from "react-native";

export function useCreateServiceStyles(){const {colors:COLORS}=useAppTheme();return StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 22, paddingTop: 44, paddingBottom: 70 },
  back: { fontSize: 15, color: COLORS.primaryDark, fontWeight: "600", marginBottom: 22 },
  heading: { fontSize: 30, fontWeight: "800", color: COLORS.text },
  subtitle: { color: COLORS.secondaryText, fontSize: 15, lineHeight: 23, marginTop: 8, marginBottom: 22 },
  card: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border },
  label: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginBottom: 8, marginTop: 12 },
  input: { borderRadius: 11, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.background, paddingHorizontal: 13, paddingVertical: 13,
    fontSize: 15, color: COLORS.text, minHeight: 48 },
  multiline: { minHeight: 95, textAlignVertical: "top" },
  primaryButton: { borderRadius: 13, backgroundColor: "#0F766E",
    alignItems: "center", justifyContent: "center", padding: 17, marginTop: 24 },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  disabled: { opacity: 0.6 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center",
    alignItems: "center", padding: 30 },
  title: { color: COLORS.text, fontWeight: "800", fontSize: 23, textAlign: "center" },
  hint: { textAlign: "center", marginVertical: 18, color: COLORS.secondaryText },
  secondaryButton: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  secondaryText: { color: COLORS.text, fontWeight: "700" },
});}
