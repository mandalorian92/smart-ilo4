import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import SystemNotification, { NotificationType } from './SystemNotification';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (
    type: NotificationType, 
    message: string, 
    title?: string, 
    duration?: number
  ) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NotificationContainer = styled.div`
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
  
  @media (max-width: 768px) {
    top: 16px;
    left: 16px;
    right: 16px;
    transform: none;
    
    > * {
      max-width: none;
      min-width: auto;
    }
  }
`;

const NotificationWrapper = styled.div<{ isExiting?: boolean }>`
  transform: ${props => props.isExiting ? 'translateY(-6px)' : 'translateY(0)'};
  opacity: ${props => props.isExiting ? 0 : 1};
  transition: all 0.25s ease-out;
`;

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notificationQueue, setNotificationQueue] = useState<NotificationItem[]>([]);
  const [exitingNotifications, setExitingNotifications] = useState<Set<string>>(new Set());
  const [currentNotification, setCurrentNotification] = useState<NotificationItem | null>(null);

  const showNotification = useCallback((
    type: NotificationType,
    message: string,
    title?: string,
    duration: number = 4000
  ) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationItem = {
      id,
      type,
      title,
      message,
      duration
    };

    // If no current notification, show immediately
    if (!currentNotification) {
      setCurrentNotification(newNotification);
      
      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    } else {
      // Queue the notification
      setNotificationQueue(prev => [...prev, newNotification]);
    }
  }, [currentNotification]);

  const removeNotification = useCallback((id: string) => {
    setCurrentNotification(current => {
      if (current?.id === id) {
        // Start exit animation
        setExitingNotifications(prev => {
          const newSet = new Set(prev);
          newSet.add(id);
          return newSet;
        });
        
        // Remove after animation completes and show next in queue
        setTimeout(() => {
          setCurrentNotification(null);
          setExitingNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
          
          // Show next notification from queue
          setNotificationQueue(prev => {
            if (prev.length > 0) {
              const [nextNotification, ...remaining] = prev;
              setCurrentNotification(nextNotification);
              
              // Auto-remove the next notification
              if (nextNotification.duration && nextNotification.duration > 0) {
                setTimeout(() => {
                  removeNotification(nextNotification.id);
                }, nextNotification.duration);
              }
              
              return remaining;
            }
            return prev;
          });
        }, 250);
        
        return current; // Keep current during animation
      }
      return current;
    });
  }, []);

  const contextValue: NotificationContextType = {
    showNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <NotificationContainer>
          {currentNotification && (
            <NotificationWrapper 
              key={currentNotification.id}
              isExiting={exitingNotifications.has(currentNotification.id)}
            >
              <SystemNotification
                type={currentNotification.type}
                title={currentNotification.title}
                message={currentNotification.message}
                onClose={() => removeNotification(currentNotification.id)}
              />
            </NotificationWrapper>
          )}
        </NotificationContainer>,
        document.body
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
