import { FontAwesome } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Tabs } from "expo-router";

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#242424",
          borderTopWidth: 0,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#3ECF8E",
        tabBarInactiveTintColor: "white",
        tabBarIconStyle: { height: 45, width: 45, margin: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tasks",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="task" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="task" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="addPost"
        options={{
          title: "addPost",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="task" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifaction"
        options={{
          title: "notifaction",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="task" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="task" size={40} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
