import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },


  content: {
    padding: 24,
    paddingBottom: 30,
  },

  header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 24,
},

logoText: {
  fontSize: 22,
  fontWeight: "700",
  color: "#2563EB",
},

profileButton: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "#2563EB",
  alignItems: "center",
  justifyContent: "center",
},

  greeting: {
    fontSize: 16,
    marginBottom: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },

});

export default styles;