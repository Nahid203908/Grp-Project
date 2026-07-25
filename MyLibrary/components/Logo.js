import { Image, StyleSheet, View } from "react-native";

export default function Logo({ size = 90 }) {
  return (
    <View
      style={[
        styles.wrapper,
        { width: size, height: size, borderRadius: size * 0.24 },
      ]}
    >
      <Image
        source={require("../assets/cpi-logo.jpg")}
        style={{ width: size * 0.72, height: size * 0.72 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
