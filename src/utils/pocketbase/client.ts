import PocketBase from 'pocketbase';

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Create PocketBase client instance
export const pb = new PocketBase(POCKETBASE_URL);

// Enable auto-cancellation for all pending requests
pb.autoCancellation(false);

// Configure auth store to use localStorage
pb.authStore.onChange((token, model) => {
  if (model) {
    // Store auth data in localStorage
    localStorage.setItem('pocketbase_auth', JSON.stringify({
      token,
      model: {
        id: model.id,
        email: model.email,
        username: model.username,
        name: model.name,
        avatar: model.avatar,
        created: model.created,
        updated: model.updated,
      }
    }));
  } else {
    localStorage.removeItem('pocketbase_auth');
  }
});

// Load auth from localStorage on init
try {
  const stored = localStorage.getItem('pocketbase_auth');
  if (stored) {
    const { token, model } = JSON.parse(stored);
    pb.authStore.save(token, model);
  }
} catch (error) {
  console.error('Failed to load PocketBase auth from localStorage:', error);
}

export default pb;
