import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    Alert,
} from "react-native";
import { router } from "expo-router";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert("Missing information", "Enter email and password.");
            return;
        }

        // We will connect your Node.js backend here next.
        console.log("Login:", email, password);

        Alert.alert("Login", "Backend connection will be added next.");
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={() => router.back()}>
                <Text style={styles.back}>← Back</Text>
            </Pressable>

            <Text style={styles.logo}>TAMILARASU</Text>
            <Text style={styles.company}>ENTERPRISES</Text>

            <Text style={styles.title}>Login</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Pressable style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginText}>Login</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/register")}>
                <Text style={styles.registerText}>
                    Don't have an account? Register
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: "center",
        backgroundColor: "#fff",
    },

    back: {
        fontSize: 17,
        marginBottom: 30,
    },

    logo: {
        fontSize: 30,
        fontWeight: "800",
        textAlign: "center",
    },

    company: {
        fontSize: 16,
        letterSpacing: 5,
        textAlign: "center",
        marginBottom: 40,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 25,
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
    },

    loginButton: {
        backgroundColor: "#111",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },

    loginText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },

    registerText: {
        textAlign: "center",
        marginTop: 25,
        fontSize: 16,
    },
});