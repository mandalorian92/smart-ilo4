import React from 'react';
import { Close } from 'grommet-icons';
import styled from 'styled-components';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface SystemNotificationProps {
  type: NotificationType;
  title?: string;
  message: string;
  onClose?: () => void;
}

const ContentWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 13px;
  line-height: 18px;
  color: #1a1a1a;
  margin-bottom: 2px;
`;

const Message = styled.div`
  font-size: 13px;
  line-height: 18px;
  color: #666666;
  word-wrap: break-word;
  max-width: 100%;
`;

const TimeStamp = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: #999999;
  margin-top: 8px;
  display: none; /* Hidden as per System design guidelines */
`;

const NotificationContainer = styled.div<{ type: NotificationType }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  max-width: 560px;
  min-width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  position: relative;
  margin: 0 auto;
  animation: fadeSlideIn 0.25s ease-out;
  
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (prefers-color-scheme: dark) {
    background: #2a2a2a;
    color: white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    
    ${Title} {
      color: #ffffff;
    }
    
    ${Message} {
      color: #cccccc;
    }
    
    ${TimeStamp} {
      color: #999999;
    }
  }
`;

const IconWrapper = styled.div<{ type: NotificationType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: ${props => {
    switch (props.type) {
      case 'success': return '50%'; // Circle for Normal/Success
      case 'warning': return '0'; // Triangle for Warning  
      case 'error': return '2px'; // Diamond/Square for Critical
      case 'info': return '2px'; // Rectangle for Unknown/Info
      default: return '2px';
    }
  }};
  background-color: ${props => {
    switch (props.type) {
      case 'success': return '#2E7D32'; // Green circle
      case 'warning': return '#F57500'; // Orange triangle
      case 'error': return '#D32F2F'; // Red diamond
      case 'info': return '#666666'; // Gray rectangle
      default: return '#666666';
    }
  }};
  ${props => props.type === 'warning' && `
    width: 0;
    height: 0;
    background-color: transparent;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 14px solid #F57500;
    border-radius: 0;
  `}
  ${props => props.type === 'error' && `
    transform: rotate(45deg);
  `}
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  color: #666666;
  flex-shrink: 0;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: #333333;
  }
  
  &:focus {
    outline: 2px solid #1976D2;
    outline-offset: 2px;
  }
  
  @media (prefers-color-scheme: dark) {
    color: #cccccc;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
  }
`;

const getIcon = (type: NotificationType) => {
  // For System design, we use CSS shapes instead of icons
  // The shapes are created by the IconWrapper styling
  return null;
};

const getDefaultTitle = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'Success';
    case 'warning':
      return 'Warning';
    case 'error':
      return 'Error';
    case 'info':
    default:
      return 'Information';
  }
};

export const SystemNotification: React.FC<SystemNotificationProps> = ({
  type,
  title,
  message,
  onClose
}) => {
  const displayTitle = title || getDefaultTitle(type);

  return (
    <NotificationContainer type={type}>
      <IconWrapper type={type} />
      
      <ContentWrapper>
        <Title>{displayTitle}</Title>
        <Message>{message}</Message>
      </ContentWrapper>
      
      {onClose && (
        <CloseButton onClick={onClose} aria-label="Close notification">
          <Close size="16px" />
        </CloseButton>
      )}
    </NotificationContainer>
  );
};

export default SystemNotification;
