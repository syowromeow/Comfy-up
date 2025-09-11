// Firebase configuration for Comfy Up Game
// You need to replace this with your own Firebase project config

// Instructions to get your config:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project called "comfy-up-game"
// 3. Go to Project Settings > General
// 4. Scroll down to "Your apps" and click "Web app" button
// 5. Register your app with name "Comfy Up"
// 6. Copy the firebaseConfig object and replace the one below

const firebaseConfig = {
    apiKey: "AIzaSyAwL28tZhcHOD89g7ob-knJkZ_aY5KM8sY",
    authDomain: "comfy-up-game.firebaseapp.com",
    databaseURL: "https://comfy-up-game-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "comfy-up-game",
    storageBucket: "comfy-up-game.firebasestorage.app",
    messagingSenderId: "122121985326",
    appId: "1:122121985326:web:8acdb52b8444f8c3b7eebf"
};

// Initialize Firebase
let app, database;

async function initializeFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }

        // Initialize Firebase app
        app = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        console.log('🔥 Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        return false;
    }
}

// Export for use in other files
window.initializeFirebase = initializeFirebase;
window.getFirebaseDatabase = () => database;
