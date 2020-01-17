import { EventEmitter, CodedError } from '@unimodules/core';
import NotificationsHandlerModule from './NotificationsHandlerModule';
export class NotificationTimeoutError extends CodedError {
    constructor(notificationId, notification) {
        super('ERR_NOTIFICATION_TIMEOUT', `Notification handling timed out for ID ${notificationId}.`);
        this.info = { id: notificationId, notification };
    }
}
// Web uses SyntheticEventEmitter
const notificationEmitter = new EventEmitter(NotificationsHandlerModule);
const handleNotificationEventName = 'onHandleNotification';
const handleNotificationTimeoutEventName = 'onHandleNotificationTimeout';
let handleSubscription = null;
let handleTimeoutSubscription = null;
export function setNotificationDelegate(delegate) {
    if (handleSubscription) {
        handleSubscription.remove();
        handleSubscription = null;
    }
    if (handleTimeoutSubscription) {
        handleTimeoutSubscription.remove();
        handleTimeoutSubscription = null;
    }
    handleSubscription = notificationEmitter.addListener(handleNotificationEventName, async ({ id, notification }) => {
        try {
            const requestedBehavior = await delegate.handleNotification(notification);
            await NotificationsHandlerModule.handleNotificationAsync(id, requestedBehavior);
            // TODO: Remove eslint-disable once we upgrade to a version that supports ?. notation.
            // eslint-disable-next-line
            delegate.handleSuccess?.(id);
        }
        catch (error) {
            // TODO: Remove eslint-disable once we upgrade to a version that supports ?. notation.
            // eslint-disable-next-line
            delegate.handleError?.(error);
        }
    });
    handleTimeoutSubscription = notificationEmitter.addListener(handleNotificationTimeoutEventName, ({ id, notification }) => delegate.handleError?.(new NotificationTimeoutError(id, notification)));
}
//# sourceMappingURL=NotificationsHandler.js.map