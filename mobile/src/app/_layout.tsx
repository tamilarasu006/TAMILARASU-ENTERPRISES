import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/verify-account"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="products/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="checkout/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="orders/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="orders/scanner"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="profile/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="services"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}