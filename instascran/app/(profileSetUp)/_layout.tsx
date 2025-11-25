import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
const _layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
};
export default _layout;
const styles = StyleSheet.create({});
