import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { AcaciaColors, AcaciaFontSizes, AcaciaRadii, AcaciaSpacing } from '../constants/theme';

interface ModalBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function ModalBottomSheet({ visible, onClose, title, children }: ModalBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
              </View>
              <View style={styles.body}>{children}</View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: AcaciaColors.surface,
    borderTopLeftRadius: AcaciaRadii.xl,
    borderTopRightRadius: AcaciaRadii.xl,
    borderWidth: 1,
    borderColor: AcaciaColors.border,
    padding: AcaciaSpacing.xl,
    maxHeight: '80%',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: AcaciaColors.border,
    paddingBottom: AcaciaSpacing.md,
    marginBottom: AcaciaSpacing.lg,
  },
  title: {
    fontSize: AcaciaFontSizes.lg,
    fontWeight: '700',
    color: AcaciaColors.textPrimary,
  },
  body: {
    gap: AcaciaSpacing.md,
  },
});
