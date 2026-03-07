import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)', // For web support if needed
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
});
