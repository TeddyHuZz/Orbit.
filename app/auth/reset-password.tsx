import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthButton } from '../../components/Auth/AuthButton';
import { AuthInput } from '../../components/Auth/AuthInput';
import { GlassContainer } from '../../components/Auth/GlassContainer';
import { supabase } from '../../lib/supabase';

function RequirementItem({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={styles.requirementItem}>
      <Text style={[styles.requirementDot, met ? styles.requirementMetDot : null]}>
        {met ? '✓' : '○'}
      </Text>
      <Text style={[styles.requirementText, met ? styles.requirementMetText : null]}>
        {label}
      </Text>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const router = useRouter();

  const validatePassword = (pass: string) => {
    const hasNumber = /\d/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const hasMinLength = pass.length >= 8;

    if (!hasMinLength) return 'Password must be at least 8 characters';
    if (!hasNumber) return 'Password must include at least one number';
    if (!hasSymbol) return 'Password must include at least one symbol';
    return '';
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setConfirmPasswordError('');

    const pError = validatePassword(password);
    if (pError) {
      setPasswordError(pError);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      Alert.alert(
        'Success', 
        'Your password has been updated successfully!',
        [{ text: 'Sign In', onPress: () => router.replace('/auth/login' as Href) }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = {
    length: password.length >= 8,
    number: /\d/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>Please set a secure password for your account</Text>
          </View>

          <GlassContainer style={styles.glassContainer}>
            <AuthInput
              label="New Password"
              placeholder="Enter new password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.requirementsContainer}>
              <RequirementItem 
                label="At least 8 characters" 
                met={passwordRequirements.length} 
              />
              <RequirementItem 
                label="At least one number" 
                met={passwordRequirements.number} 
              />
              <RequirementItem 
                label="At least one symbol" 
                met={passwordRequirements.symbol} 
              />
            </View>

            <AuthInput
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              error={confirmPasswordError || (confirmPassword && password !== confirmPassword ? 'Passwords do not match' : '')}
              secureTextEntry
              autoCapitalize="none"
            />

            <AuthButton
              title="Update Password"
              onPress={handleUpdatePassword}
              loading={loading}
              style={styles.button}
            />
          </GlassContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  glassContainer: {
    width: '100%',
    padding: 24,
  },
  button: {
    marginTop: 16,
  },
  requirementsContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementDot: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    marginRight: 8,
    width: 14,
  },
  requirementMetDot: {
    color: '#00C853',
    fontWeight: '800',
  },
  requirementText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
  requirementMetText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
