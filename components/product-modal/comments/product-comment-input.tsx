import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../../common/UserAvatar';

interface ProductCommentInputProps {
  replyingTo?: { id: string; user: string } | null;
  onSubmit: (text: string, replyingTo?: { id: string; user: string } | null) => void;
  onCancel?: () => void;
  composerAvatarUrl?: string | null;
}

export default function ProductCommentInput({
  replyingTo,
  onSubmit,
  onCancel,
  composerAvatarUrl,
}: ProductCommentInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return;
    }

    onSubmit(trimmedText, replyingTo || null);
    setText('');
  };

  const placeholder = replyingTo
    ? `Reply to @${replyingTo.user}…`
    : 'Add a comment…';

  return (
    <View style={styles.container}>
      {/* Replying to indicator */}
      {replyingTo && (
        <View style={styles.replyingToContainer}>
          <Text style={styles.replyingToText}>
            Replying to @{replyingTo.user}
          </Text>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Ionicons name="close" size={16} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <UserAvatar avatarUrl={composerAvatarUrl} size={26} style={styles.avatar} />

        {/* TextInput */}
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
          multiline={false}
          autoCapitalize="sentences"
          autoCorrect={true}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />

        {/* Send button */}
        <TouchableOpacity
          style={[styles.sendButton, text.trim().length === 0 && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.7}
          disabled={text.trim().length === 0}
        >
          <Ionicons
            name="send"
            size={20}
            color={text.trim().length > 0 ? '#007AFF' : '#999'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e6e6e6',
    backgroundColor: '#fff',
  },
  replyingToContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyingToText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  cancelButton: {
    padding: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

