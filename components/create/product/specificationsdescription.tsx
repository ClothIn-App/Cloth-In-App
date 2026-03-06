// src/create/product/specificationsdescription.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { useAddProductContext } from './addproductcontext';

export default function SpecificationsDescription() {
  const { specifications, description, setSpecifications, setDescription } = useAddProductContext();
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Specifications + Description</Text>

      <Pressable
        style={styles.addButton}
        onPress={() => setShowSpecsModal(true)}
      >
        <Text style={styles.addButtonText}>
          {specifications ? 'Edit Specifications' : 'Add Specifications'}
        </Text>
        {specifications && <Text style={styles.previewText}>{specifications}</Text>}
      </Pressable>

      <Pressable
        style={styles.addButton}
        onPress={() => setShowDescModal(true)}
      >
        <Text style={styles.addButtonText}>
          {description ? 'Edit Description' : 'Add Description'}
        </Text>
        {description && <Text style={styles.previewText}>{description}</Text>}
      </Pressable>

      <Modal visible={showSpecsModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowSpecsModal(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalHeaderButtonText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Add Specifications</Text>
            <Pressable onPress={() => setShowSpecsModal(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalHeaderButtonText}>Done</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.textArea}
              value={specifications}
              onChangeText={setSpecifications}
              placeholder="Add product specifications (size, material, color, etc.)"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>{specifications.length}/1000</Text>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showDescModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowDescModal(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalHeaderButtonText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Add Description</Text>
            <Pressable onPress={() => setShowDescModal(false)} style={styles.modalHeaderButton}>
              <Text style={styles.modalHeaderButtonText}>Done</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Add product description"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>{description.length}/1000</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  previewText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderButton: {
    padding: 8,
    minWidth: 60,
  },
  modalHeaderButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
});
