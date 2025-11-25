import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#FFEBFE",
          borderTopWidth: 0,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#A8D8B0",
        tabBarInactiveTintColor: "#c6fbcfff",
        tabBarIconStyle: { height: 45, width: 45, margin: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tasks",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home-filled" size={38} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="addPost"
        options={{
          title: "addPost",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <AntDesign name="plus-square" size={42} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifaction"
        options={{
          title: "notifaction",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="bell" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user-circle" size={38} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
