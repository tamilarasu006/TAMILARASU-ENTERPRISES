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

export default function RegisterScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = () => {
        if (!name || !email || !phone || !password) {
            Alert.alert(
                "Missing information",
                "Please fill all fields."
            );
            return;
        }

        // We will connect your existing Node.js registration API here.
        console.log({
            name,
            email,
            phone,
            password,
        });

        Alert.alert(
            "Registration",
            "Backend connection will be added next."
        );
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={() => router.back()}>
                <Text style={styles.back}>← Back</Text>
            </Pressable>

            <Text style={styles.logo}>TAMILARASU</Text>
            <Text style={styles.company}>ENTERPRISES</Text>

            <Text style={styles.title}>Create Account</Text>

            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
            />

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
                placeholder="Mobile Number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Pressable
                style={styles.registerButton}
                onPress={handleRegister}
            >
                <Text style={styles.registerButtonText}>
                    Create Account
                </Text>
            </Pressable>

            <Pressable onPress={() => router.push("/login")}>
                <Text style={styles.loginText}>
                    Already have an account? Login
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
        marginBottom: 25,
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
        marginBottom: 30,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 20,
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 13,
    },

    registerButton: {
        backgroundColor: "#111",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 8,
    },

    registerButtonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },

    loginText: {
        textAlign: "center",
        marginTop: 22,
        fontSize: 16,
    },
});