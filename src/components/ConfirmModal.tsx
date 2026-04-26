import styled from 'styled-components';
import { motion, AnimatePresence } from  "framer-motion";
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'danger'
}: ConfirmModalProps) {
  const colors = {
    danger: { main: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
    warning: { main: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
    info: { main: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
  };

  const color = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <Modal
            as={motion.div}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{ borderColor: color.border }}
          >
            <Header>
              <TitleWrapper>
                <AlertTriangle size={20} color={color.main} />
                <Title>{title}</Title>
              </TitleWrapper>
              <CloseButton onClick={onCancel}>
                <X size={18} />
              </CloseButton>
            </Header>

            <Content>
              <Message>{message}</Message>
              
              <ActionGroup>
                <CancelBtn onClick={onCancel}>{cancelText}</CancelBtn>
                <ConfirmBtn 
                  onClick={onConfirm}
                  style={{ background: color.main }}
                  as={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {confirmText}
                </ConfirmBtn>
              </ActionGroup>
            </Content>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(8px);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const Modal = styled.div`
  width: 100%;
  max-width: 400px;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 1.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const Header = styled.div`
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Title = styled.h2`
  font-size: 1rem;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f1f5f9;
  }
`;

const Content = styled.div`
  padding: 1.5rem;
`;

const Message = styled.p`
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelBtn = styled.button`
  padding: 0.75rem 1.25rem;
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f1f5f9;
  }
`;

const ConfirmBtn = styled.button`
  padding: 0.75rem 1.5rem;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;
