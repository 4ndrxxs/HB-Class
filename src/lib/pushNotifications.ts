import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications only available on native platform')
    return
  }

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') {
    console.log('Push notification permission not granted')
    return
  }

  await PushNotifications.register()

  PushNotifications.addListener('registration', (token) => {
    console.log('FCM Token:', token.value)
    // TODO: Save token to Supabase for targeted notifications
  })

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error)
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action:', action)
  })
}
