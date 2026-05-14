/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    url: string
    revision?: string
  }>
}

type PushNotificationPayload = {
  notification?: {
    title?: string
    body?: string
    data?: Record<string, string>
  }
}

clientsClaim()
self.skipWaiting()

precacheAndRoute(self.__WB_MANIFEST)

function getNavigationUrl(data: Record<string, string> = {}) {
  const type = data.type || ''

  if (type === 'new_company' && data.companyId) {
    return `/companies/${data.companyId}`
  }

  if ((type === 'form_assignment' || type === 'new_form') && data.formId) {
    return `/forms/${data.formId}`
  }

  if (type === 'message_mention' || type === 'announcement') {
    return '/messages'
  }

  return '/'
}

function readPushPayload(event: PushEvent): PushNotificationPayload {
  try {
    return (event.data?.json() ?? {}) as PushNotificationPayload
  } catch {
    return {
      notification: {
        title: 'New notification',
        body: event.data?.text() ?? '',
      },
    }
  }
}

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event)
  const notification = payload.notification ?? {}
  const title = notification.title ?? 'New notification'
  const data = notification.data ?? {}

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      windowClients.forEach((client) => {
        client.postMessage({
          type: 'PUSH_NOTIFICATION',
          notification: {
            title,
            body: notification.body ?? '',
            data,
          },
        })
      })

      const hasFocusedClient = windowClients.some((client) => client.focused)
      if (hasFocusedClient) return

      await self.registration.showNotification(title, {
        body: notification.body ?? '',
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        data,
      })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = getNavigationUrl(
    (event.notification.data ?? {}) as Record<string, string>,
  )

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of allClients) {
        if ('focus' in client) {
          await client.navigate(url)
          await client.focus()
          return
        }
      }

      await self.clients.openWindow(url)
    })(),
  )
})
