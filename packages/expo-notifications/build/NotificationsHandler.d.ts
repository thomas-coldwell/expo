import { CodedError } from '@unimodules/core';
import { NotificationBehavior } from './NotificationsHandlerModule';
declare type Notification = any;
export declare class NotificationTimeoutError extends CodedError {
    info: {
        notification: Notification;
        id: string;
    };
    constructor(notificationId: string, notification: Notification);
}
export declare type NotificationHandlingError = NotificationTimeoutError | Error;
export interface NotificationDelegate {
    handleNotification: (notification: Notification) => Promise<NotificationBehavior>;
    handleSuccess?: (notificationId: string) => void;
    handleError?: (error: NotificationHandlingError) => void;
}
export declare function setNotificationDelegate(delegate: NotificationDelegate): void;
export {};
