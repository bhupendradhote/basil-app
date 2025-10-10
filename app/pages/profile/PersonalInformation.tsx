import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Entypo from '@expo/vector-icons/Entypo';

const PersonalInformation = () => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState(""); // <-- Phone state
    const [editableField, setEditableField] = useState<"name" | "phone" | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user data from AsyncStorage
const loadUserData = async () => {
    try {
        const userData = await AsyncStorage.getItem("user");

        if (userData) {
            const parsedUser = JSON.parse(userData);
            console.log("User Data:", parsedUser); // debug to check if phone exists
            setName(parsedUser.name || "User");
            setEmail(parsedUser.email || "Not Available");
            setPhone(parsedUser.phone || ""); // <-- this will work if API/AsyncStorage includes phone
            setProfileImage(parsedUser.avatar || "https://i.pravatar.cc/150?img=12");
        }
    } catch (error) {
        console.error("Error loading user:", error);
    } finally {
        setLoading(false);
    }
};


    useEffect(() => {
        loadUserData();
    }, []);

    const handleSave = async () => {
        try {
            const userData = { name, email, phone, avatar: profileImage }; // <-- Include phone
            await AsyncStorage.setItem("user", JSON.stringify(userData));
            Alert.alert("Profile Saved", "Your personal information has been updated.");
            setEditableField(null); // Disable editing after save
        } catch (error) {
            Alert.alert("Error", "Failed to save profile.");
        }
    };

    const handleEdit = (field: "name" | "phone") => {
        setEditableField(field);
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#1A3D2E" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#2c2c2c" />
            </TouchableOpacity>

            <Text style={styles.heading}>Personal Information</Text>

            {/* Profile Image Section */}
            <View style={styles.imageContainer}>
                <Image
                    source={{
                        uri:
                            profileImage ||
                            "https://cdn.pixabay.com/photo/2022/12/24/21/14/portrait-7676482_1280.jpg",
                    }}
                    style={styles.profileImage}
                />
                <TouchableOpacity style={styles.editProfileBtn} >
                    <Entypo style={styles.editProfileText} name="camera" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Name */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <View style={styles.inputBox}>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        editable={editableField === "name"}
                    />
                    <TouchableOpacity onPress={() => handleEdit("name")}>
                        <Ionicons name="pencil" size={18} color="#1A3D2E" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputBox, { backgroundColor: "#f2f2f2" }]}>
                    <TextInput
                        style={[styles.input, { color: "#888" }]}
                        value={email}
                        editable={false}
                    />
                </View>
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone number</Text>
                <View style={styles.inputBox}>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Add number"
                        editable={editableField === "phone"}
                        keyboardType="phone-pad"
                    />
                    <TouchableOpacity onPress={() => handleEdit("phone")}>
                        <Ionicons name="pencil" size={18} color="#1A3D2E" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
        </View>
    );
};

export default PersonalInformation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFDF8",
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    backButton: {
        marginBottom: 10,
    },
    heading: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A3D2E",
        marginBottom: 20,
    },
    imageContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editProfileBtn: {
        backgroundColor: "#1A3D2E",
        paddingHorizontal: 20,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 8,
    },
    editProfileText: {
        color: "#fff",
        fontWeight: "500",
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: "#1A3D2E",
        marginBottom: 6,
    },
    inputBox: {
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: "#000",
    },
    saveButton: {
        backgroundColor: "#1A3D2E",
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 12,
    },
    saveText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
