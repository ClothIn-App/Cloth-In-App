/**
 * FitPicDetailModal Component
 * Wrapper for FitPicDetail that provides modal behavior
 */

import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import FitPicDetail from './FitPicDetail';
import type { FitPic } from '../types/fitpic';

type Props = {
  fitpic: FitPic | null;
  visible: boolean;
  onClose: () => void;
  onLike?: (fitpic: FitPic) => void;
  onSave?: (fitpic: FitPic) => void;
  onProductPress?: (product: any) => void;
};

export default function FitPicDetailModal({
  fitpic,
  visible,
  onClose,
  onLike,
  onSave,
  onProductPress,
}: Props) {
  if (!fitpic) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <FitPicDetail
        fitpic={fitpic}
        onClose={onClose}
        onLike={onLike}
        onSave={onSave}
        onProductPress={onProductPress}
      />
    </Modal>
  );
}
