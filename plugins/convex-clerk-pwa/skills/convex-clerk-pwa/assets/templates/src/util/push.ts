// Helpers for subscribing the browser to Web Push so notifications can be
// delivered while the (iOS) PWA is backgrounded or closed.

// VAPID public key conversion (base64url -> Uint8Array) required by
// pushManager.subscribe.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

type SavedSubscription = { endpoint: string; p256dh: string; auth: string };

function serializeSubscription(sub: PushSubscription): SavedSubscription {
  const json = sub.toJSON();
  const keys = json.keys ?? {};
  return {
    endpoint: sub.endpoint,
    p256dh: keys.p256dh ?? "",
    auth: keys.auth ?? "",
  };
}

// Requests notification permission (must be called from a user gesture on
// iOS), subscribes to push, and persists the subscription via the provided
// callback (typically a Convex mutation: api.push.savePushSubscription).
// Returns the permission string, or throws on failure.
export async function enablePush(
  saveSubscription: (sub: SavedSubscription) => Promise<unknown>
): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported on this device.");
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as
    | string
    | undefined;
  if (!vapidPublicKey) {
    throw new Error("Missing VITE_VAPID_PUBLIC_KEY.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return permission;
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  await saveSubscription(serializeSubscription(subscription));
  return permission;
}
