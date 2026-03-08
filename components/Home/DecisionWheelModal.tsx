import { GlassContainer } from '@/components/Auth/GlassContainer';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 80;

interface DecisionWheelModalProps {
  visible: boolean;
  onClose: () => void;
  plans: any[];
  onResult: (plan: any) => void;
}

export function DecisionWheelModal({ visible, onClose, plans, onResult }: DecisionWheelModalProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Create a long list for the "endless" scroll effect
  const [displayPlans, setDisplayPlans] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      // Setup display plans: repeating the original list multiple times
      const repeated = [];
      for(let i = 0; i < 10; i++) repeated.push(...plans);
      setDisplayPlans(repeated);
      
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
      ]).start();
    } else {
      setResult(null);
      setIsSpinning(false);
      scrollY.setValue(0);
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible, plans]);

  const startSpin = () => {
    if (isSpinning || plans.length === 0) return;

    setIsSpinning(true);
    setResult(null);
    scrollY.setValue(0);

    const rounds = 3 + Math.floor(Math.random() * 3);
    const winningIndex = Math.floor(Math.random() * plans.length);
    const totalItems = (rounds * plans.length) + winningIndex;
    const finalOffset = totalItems * ITEM_HEIGHT;

    // Trigger haptics at the start
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.timing(scrollY, {
      toValue: -finalOffset,
      duration: 3500,
      easing: Easing.bezier(0.15, 0, 0.2, 1),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      const chosen = plans[winningIndex];
      setResult(chosen);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    });
  };

  const handleGoToDate = () => {
    if (result) {
      onResult(result);
      onClose();
    }
  };

  if (plans.length === 0) return null;

  return (
    <Modal visible={visible} animationType="none" transparent={true}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
          <GlassContainer style={styles.modalContent}>
            {/* Background Decorative Orbs */}
            <View style={styles.bgOrb1} />
            <View style={styles.bgOrb2} />

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose} 
              disabled={isSpinning}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DATE DECIDER</Text>
              </View>
              <Text style={styles.title}>Fate's Choice</Text>
              <Text style={styles.subtitle}>Let the universe guide your night</Text>
            </View>

            <View style={styles.slotMachineWrapper}>
              <View style={styles.slotContainer}>
                {/* Fixed Selection Highlight Bar */}
                <View style={styles.selectionHighlight}>
                  <View style={styles.highlightLine} />
                  <View style={styles.selectionGlow} />
                  <View style={styles.highlightLine} />
                </View>

                <Animated.View 
                  style={{ transform: [{ translateY: scrollY }] }}
                >
                  {displayPlans.map((plan, index) => (
                    <View key={index} style={styles.slotItem}>
                      <Text style={styles.slotText} numberOfLines={1}>{plan.title}</Text>
                    </View>
                  ))}
                </Animated.View>
                
                {/* Visual Gradients for Depth */}
                <View style={styles.gradientTop} />
                <View style={styles.gradientBottom} />
                
                {/* Corner Pointers */}
                <View style={styles.leftPointer}>
                  <Ionicons name="caret-forward" size={18} color="#6C5CE7" />
                </View>
                <View style={styles.rightPointer}>
                  <Ionicons name="caret-back" size={18} color="#6C5CE7" />
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              {!result ? (
                <View style={styles.initialFooter}>
                   <View style={styles.instructionBox}>
                     <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.4)" />
                     <Text style={styles.instructionText}>The wheel picks from your planned dates</Text>
                   </View>
                   <TouchableOpacity 
                    style={[styles.spinButton, isSpinning && styles.disabledButton]} 
                    onPress={startSpin}
                    disabled={isSpinning}
                  >
                    <Text style={styles.buttonText}>
                      {isSpinning ? 'SPINNING...' : 'TAP TO SPIN'}
                    </Text>
                    {!isSpinning && <Ionicons name="sparkles" size={18} color="#FFF" />}
                  </TouchableOpacity>
                </View>
              ) : (
                <Animated.View style={styles.resultActions}>
                   <View style={styles.winBadge}>
                     <Ionicons name="heart" size={16} color="#6C5CE7" />
                     <Text style={styles.winText}>PERFECT MATCH!</Text>
                   </View>
                  
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={startSpin}>
                      <Text style={styles.secondaryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleGoToDate}>
                      <Text style={styles.primaryButtonText}>Let's go!</Text>
                      <Feather name="arrow-right" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </View>
          </GlassContainer>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 20, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0F0C29',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(108, 92, 231, 0.05)',
  },
  bgOrb2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(108, 92, 231, 0.03)',
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A29BFE',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    marginTop: 4,
  },
  slotMachineWrapper: {
    width: '100%',
    height: ITEM_HEIGHT + 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  slotContainer: {
    width: '100%',
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  selectionHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 2,
    paddingVertical: 1,
  },
  highlightLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(108, 92, 231, 0.3)',
  },
  selectionGlow: {
    flex: 1,
    backgroundColor: 'rgba(108, 92, 231, 0.04)',
  },
  leftPointer: {
    position: 'absolute',
    left: 12,
    top: (ITEM_HEIGHT - 18) / 2,
    zIndex: 3,
  },
  rightPointer: {
    position: 'absolute',
    right: 12,
    top: (ITEM_HEIGHT - 18) / 2,
    zIndex: 3,
  },
  slotItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slotText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: '#0F0C29',
    opacity: 0.85,
    zIndex: 1,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: '#0F0C29',
    opacity: 0.85,
    zIndex: 1,
  },
  footer: {
    width: '100%',
  },
  initialFooter: {
    width: '100%',
    alignItems: 'center',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
    opacity: 0.6,
  },
  instructionText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '400',
  },
  spinButton: {
    backgroundColor: '#6C5CE7',
    width: '100%',
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultActions: {
    width: '100%',
    alignItems: 'center',
  },
  winBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    marginBottom: 24,
  },
  winText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#A29BFE',
    letterSpacing: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#6C5CE7',
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '700',
  },
});
