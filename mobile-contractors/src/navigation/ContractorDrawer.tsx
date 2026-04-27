import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { DashboardScreen } from "../screens/DashboardScreen";
import { InvoicesScreen } from "../screens/InvoicesScreen";
import {
  ExpensesScreen,
  BankAccountScreen,
  ConfigurationScreen,
  SupportScreen
} from "../screens/PlaceholderScreens";
import { Sidebar } from "../components/Sidebar";

import { DrawerToggleButton } from "@react-navigation/drawer";

const Drawer = createDrawerNavigator();

export function ContractorDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{
        drawerPosition: "left",
        headerLeft: () => <DrawerToggleButton tintColor="#3152A3" />,
        headerStyle: {
          backgroundColor: "#ffffff"
        },
        headerTintColor: "#3152A3",
        headerTitleStyle: {
          fontWeight: "700"
        }
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Invoices" component={InvoicesScreen} />
      <Drawer.Screen name="Expenses" component={ExpensesScreen} />
      <Drawer.Screen name="Bank Account" component={BankAccountScreen} />
      <Drawer.Screen name="Configuration" component={ConfigurationScreen} />
      <Drawer.Screen name="Support" component={SupportScreen} />
    </Drawer.Navigator>
  );
}
