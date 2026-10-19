import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Modal
} from 'react-native';
import { updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

// Preset avatar gallery for Indian/Sinhala classical music students & artists
const AVATAR_PRESETS = [
  { id: '1', name: 'Classical Vocalist', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80' },
  { id: '2', name: 'Violin Maestro', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&q=80' },
  { id: '3', name: 'Flutist', uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop&q=80' },
  { id: '4', name: 'Tabla Artist', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop&q=80' },
  { id: '5', name: 'Sitar Scholar', uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&fit=crop&q=80' },
  { id: '6', name: 'Naada Scholar', uri: 'https://i.pravatar.cc/150?img=47' },
];

export default function EditProfileScreen({ navigation }) {
  const {
    user,
    updateUserProfileState,
    updateUserEmailAddress,
    updateUserPasswordCredential
  } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || user?.profileImage || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Avatar Selection Modal state
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  const defaultAvatar = 'https://i.pravatar.cc/150?img=47';
  const displayAvatar = photoURL || defaultAvatar;

  const handleSelectPreset = (uri) => {
    setPhotoURL(uri);
    setIsAvatarModalVisible(false);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid image URL.');
      return;
    }
    setPhotoURL(customUrlInput.trim());
    setCustomUrlInput('');
    setIsAvatarModalVisible(false);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New passwords do not match.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters long.');
      return;
    }

    setIsUpdating(true);

    try {
      // 1. Update Email if changed
      if (email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
        if (!currentPassword) {
          setIsUpdating(false);
          Alert.alert('Re-authentication Required', 'Please enter your current password to update your email.');
          return;
        }
        await updateUserEmailAddress(email.trim(), currentPassword);
      }

      // 2. Update Password if specified
      if (newPassword) {
        if (!currentPassword) {
          setIsUpdating(false);
          Alert.alert('Re-authentication Required', 'Please enter your current password to change your password.');
          return;
        }
        await updateUserPasswordCredential(newPassword, currentPassword);
      }

      // 3. Update Firebase Client Auth DisplayName / PhotoURL
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: name.trim(),
            photoURL: photoURL || null
          });
        } catch (authProfErr) {
          console.warn('Could not update Firebase client profile:', authProfErr.message);
        }
      }

      // 4. Update Backend Profile via Spring Boot API Gateway
      const payload = {
        name: name.trim(),
        photoURL: photoURL || null
      };

      let backendSuccess = false;
      try {
        const response = await axiosClient.put('/api/v1/users/profile', payload);
        if (response?.data) {
          updateUserProfileState({
            ...response.data,
            name: name.trim(),
            displayName: name.trim(),
            photoURL: photoURL,
            profileImage: photoURL,
            email: email.trim()
          });
          backendSuccess = true;
        }
      } catch (backendErr) {
        console.warn('Backend profile update note:', backendErr.message);
      }

      if (!backendSuccess) {
        updateUserProfileState({
          ...user,
          name: name.trim(),
          displayName: name.trim(),
          photoURL: photoURL,
          profileImage: photoURL,
          email: email.trim()
        });
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to update profile. Please try again.';
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Selection Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
            <View style={styles.avatarGlow} />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setIsAvatarModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.cameraIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setIsAvatarModalVisible(true)}>
            <Text style={styles.changePhotoText}>Change Profile Picture</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Avatar Presets Horizontal Bar */}
        <View style={styles.presetSection}>
          <Text style={styles.presetHeaderTitle}>Quick Avatars</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetList}
          >
            {AVATAR_PRESETS.map((preset) => {
              const isSelected = photoURL === preset.uri;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[styles.presetItem, isSelected && styles.presetItemSelected]}
                  onPress={() => handleSelectPreset(preset.uri)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: preset.uri }} style={styles.presetImage} />
                  {isSelected && (
                    <View style={styles.presetCheckmark}>
                      <Text style={styles.presetCheckmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Basic Information Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#666"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Security & Credentials Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Security & Credentials</Text>
          <Text style={styles.sectionSubtitle}>
            Leave password fields blank if you do not wish to change your password.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.textInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Required for Email or Password changes"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min. 6 characters)"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isUpdating}
          activeOpacity={0.85}
        >
          {isUpdating ? (
            <ActivityIndicator color="#121212" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isUpdating}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Avatar Selection Modal */}
      <Modal
        visible={isAvatarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity onPress={() => setIsAvatarModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Pick a preset avatar or paste an image URL:</Text>

            {/* Presets Grid */}
            <View style={styles.modalGrid}>
              {AVATAR_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.modalGridItem}
                  onPress={() => handleSelectPreset(preset.uri)}
                >
                  <Image source={{ uri: preset.uri }} style={styles.modalGridImage} />
                  <Text style={styles.modalPresetLabel} numberOfLines={1}>{preset.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom URL Input */}
            <View style={styles.modalInputSection}>
              <Text style={styles.inputLabel}>Custom Image URL</Text>
              <View style={styles.urlInputRow}>
                <TextInput
                  style={[styles.textInput, styles.urlInput]}
                  value={customUrlInput}
                  onChangeText={setCustomUrlInput}
                  placeholder="https://example.com/avatar.jpg"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.urlApplyButton}
                  onPress={handleApplyCustomUrl}
                >
                  <Text style={styles.urlApplyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#1a1a24',
  },
  backButtonText: {
    color: '#00e5ff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: '#c074ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    borderColor: '#c074ff',
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 60,
    backgroundColor: 'rgba(192, 116, 255, 0.25)',
    zIndex: 1,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#00e5ff',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    borderWidth: 2,
    borderColor: '#121212',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  cameraIcon: {
    fontSize: 15,
  },
  changePhotoText: {
    color: '#00e5ff',
    fontSize: 14,
    fontWeight: '600',
  },
  presetSection: {
    marginBottom: 20,
  },
  presetHeaderTitle: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  presetList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetItem: {
    position: 'relative',
    borderRadius: 30,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemSelected: {
    borderColor: '#00e5ff',
  },
  presetImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  presetCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00e5ff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetCheckmarkText: {
    color: '#121212',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2d2042',
  },
  sectionHeaderTitle: {
    color: '#e0c8ff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#bbb',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#121218',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#382b52',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#00e5ff',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#888899',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2d2042',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseText: {
    color: '#888',
    fontSize: 20,
    padding: 4,
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 18,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalGridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalGridImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#382b52',
    marginBottom: 6,
  },
  modalPresetLabel: {
    color: '#aaa',
    fontSize: 11,
    textAlign: 'center',
  },
  modalInputSection: {
    marginTop: 8,
    marginBottom: 14,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urlInput: {
    flex: 1,
  },
  urlApplyButton: {
    backgroundColor: '#00e5ff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlApplyButtonText: {
    color: '#121212',
    fontWeight: '700',
    fontSize: 14,
  },
});
