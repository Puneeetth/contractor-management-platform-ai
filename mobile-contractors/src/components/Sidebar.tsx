import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export const Sidebar = (props: DrawerContentComponentProps) => {
  const { session, signOut } = useAuth();

  // Safe route name detection
  const currentRouteName = props.state?.routeNames[props.state?.index] || "Dashboard";

  const menuItems = [
    { name: "Dashboard", icon: "grid-outline", type: "ionicons" },
    { name: "Invoices", icon: "receipt-outline", type: "ionicons" },
    { name: "Expenses", icon: "cash-outline", type: "ionicons" },
    { name: "Bank Account", icon: "bank-outline", type: "material" },
    { name: "Configuration", icon: "settings-outline", type: "ionicons" },
    { name: "Support", icon: "help-circle-outline", type: "ionicons" },
  ];

  return (
    <View style={styles.container}>
      {/* Header / Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="wallet" size={24} color="white" />
          </View>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoMainText}>Ironclad Ledger</Text>
            <Text style={styles.logoSubText}>FISCAL CONTROLLER</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>WORKSPACE MANAGEMENT</Text>

        {menuItems.map((item) => {
          const isActive = currentRouteName === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => props.navigation.navigate(item.name)}
            >
              <View style={styles.menuIconContainer}>
                {item.type === "ionicons" ? (
                  <Ionicons name={item.icon as any} size={22} color={isActive ? "#3152A3" : "#64748B"} />
                ) : (
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={22}
                    color={isActive ? "#3152A3" : "#64748B"}
                  />
                )}
              </View>
              <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                {item.name.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer / Profile */}
      <View style={styles.footer}>
        <View style={styles.profileContainer}>
          <Image
            source={{ uri: "https://ui-avatars.com/api/?name=" + (session?.contractor.fullName || "User") + "&background=0D8ABC&color=fff" }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{session?.contractor.fullName || "Admin User"}</Text>
            <Text style={styles.versionText}>v1.0.4</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2F7"
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 12
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 26
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  logoBox: {
    width: 45,
    height: 45,
    backgroundColor: "#3152A3",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#3152A3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4
  },
  logoTextContainer: {
    justifyContent: "center"
  },
  logoMainText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3152A3"
  },
  logoSubText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    letterSpacing: 1.2
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    paddingHorizontal: 20,
    marginBottom: 15,
    letterSpacing: 1.5
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  activeMenuItem: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4
  },
  menuIconContainer: {
    marginRight: 15,
    width: 25,
    alignItems: "center"
  },
  menuText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.9
  },
  activeMenuText: {
    color: "#3152A3"
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#DDE5EF",
    paddingBottom: 34
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  profileInfo: {
    justifyContent: "center"
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827"
  },
  versionText: {
    fontSize: 11,
    color: "#64748B"
  },
  logoutButton: {
    backgroundColor: "#3152A3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 4,
    shadowColor: "#3152A3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 5
  },
  logoutText: {
    color: "white",
    fontWeight: "700",
    marginLeft: 10,
    fontSize: 13,
    letterSpacing: 1
  }
});
