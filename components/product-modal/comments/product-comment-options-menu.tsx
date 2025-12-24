import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import type { CommentType } from '../../../src/types/feed';

interface ProductCommentOptionsMenuProps {
  visible: boolean;
  comment: CommentType | null;
  onClose: () => void;
  onReport: (comment: CommentType) => void;
  onGoToUser: (comment: CommentType) => void;
  onShare: (comment: CommentType) => void;
}

export default function ProductCommentOptionsMenu({
  visible,
  comment,
  onClose,
  onReport,
  onGoToUser,
  onShare,
}: ProductCommentOptionsMenuProps) {
  // Don't render if not visible or no comment
  if (!visible || !comment) {
    return null;
  }

  const handleReport = () => {
    onReport(comment);
    onClose();
  };

  const handleGoToUser = () => {
    onGoToUser(comment);
    onClose();
  };

  const handleShare = () => {
    onShare(comment);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Options for @{comment.user}</Text>
          </View>

          {/* Options List */}
          <View style={styles.optionsContainer}>
            {/* Report comment */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleReport}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>Report comment</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Go to user */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleGoToUser}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>Go to user</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Share comment */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>Share comment</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6e6e6',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e6e6e6',
    marginLeft: 16,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e6e6e6',
  },
  cancelText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
});

