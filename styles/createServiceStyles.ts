import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6FC" },
  content: { padding: 22, paddingTop: 44, paddingBottom: 70 },
  back: { fontSize: 15, color: "#2563EB", fontWeight: "600", marginBottom: 22 },
  heading: { fontSize: 30, fontWeight: "800", color: "#0F172A" },
  subtitle: { color: "#64748B", fontSize: 15, lineHeight: 23, marginTop: 8, marginBottom: 22 },
  card: { backgroundColor: "#FFFFFF", padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: "#E2E8F0" },
  label: { color: "#334155", fontSize: 14, fontWeight: "700", marginBottom: 8, marginTop: 12 },
  input: { borderRadius: 11, borderWidth: 1, borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC", paddingHorizontal: 13, paddingVertical: 13,
    fontSize: 15, color: "#0F172A", minHeight: 48 },
  multiline: { minHeight: 95, textAlignVertical: "top" },
  primaryButton: { borderRadius: 13, backgroundColor: "#0F766E",
    alignItems: "center", justifyContent: "center", padding: 17, marginTop: 24 },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  disabled: { opacity: 0.6 },
  center: { flex: 1, backgroundColor: "#F2F6FC", justifyContent: "center",
    alignItems: "center", padding: 30 },
  title: { color: "#0F172A", fontWeight: "800", fontSize: 23, textAlign: "center" },
  hint: { textAlign: "center", marginVertical: 18, color: "#64748B" },
  secondaryButton: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#CBD5E1" },
  secondaryText: { color: "#0F172A", fontWeight: "700" },
});
export default styles;
