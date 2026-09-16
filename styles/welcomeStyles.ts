import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
  },

  button: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});

export default styles;