importScripts("https://www.gstatic.com/firebasejs/8.6.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.6.1/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyBIVW2xchzn3TSAbUgz-abM9dl2hFiSprI",
  authDomain: "mercor-hiring.firebaseapp.com",
  projectId: "mercor-hiring",
  storageBucket: "mercor-hiring.appspot.com",
  messagingSenderId: "1022267415978",
  appId: "1:1022267415978:web:49bd142f163836fdc29fd3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = "Background Message Title";
  const notificationOptions = {
    icon: "/logo512.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
