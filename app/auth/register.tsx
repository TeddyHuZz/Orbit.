import { Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [emailError, setEmailError] = useState('');
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

  const handleRegister = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    }

    const pError = validatePassword(password);
    if (pError) {
      setPasswordError(pError);
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const { error, data: { session } } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'orbit://',
        },
      });

      if (error) throw error;
      
      if (!session) {
        Alert.alert(
          'Success', 
          'Verification email sent. Please check your inbox.',
          [{ text: 'OK', onPress: () => router.replace('/auth/login' as Href) }]
        );
      } else {
        router.replace('/' as Href); // Navigate to home
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join Orbit</Text>
            <Text style={styles.subtitle}>Start saving your precious moments</Text>
          </View>

          <GlassContainer style={styles.glassContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            
            <AuthInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AuthInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Password Requirements Checklist */}
            <View style={styles.requirementsContainer}>
              <RequirementItem 
                label="At least 8 characters" 
                met={password.length >= 8} 
              />
              <RequirementItem 
                label="At least one number" 
                met={/\d/.test(password)} 
              />
              <RequirementItem 
                label="At least one symbol" 
                met={/[!@#$%^&*(),.?":{}|<>]/.test(password)} 
              />
            </View>

            <AuthInput
              label="Confirm Password"
              placeholder="Repeat your password"
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
              title="Get Started"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login' as Href)}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </GlassContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29', // Deep space background
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 10,
  },
  backButtonText: {
    color: '#6C5CE7',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    textAlign: 'center',
  },
  glassContainer: {
    width: '100%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  linkText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '600',
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
