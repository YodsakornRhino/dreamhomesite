# Firebase security rules for DreamHome chat

The chat UI stores two types of data:

- **Shared conversations** in the top-level `conversation` collection with
  fields like `participants`, `participantProfiles`, `lastMessage`, and the
  `messages` sub-collection.
- **Per-user metadata** in `/users/{userId}/Chat/{conversationId}` where each
  participant can manage their own pin and unread state.

Update your Firestore and Storage rules so only authenticated participants can
read or write to these paths while keeping the existing property rules intact.

## Firestore rules

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function getConversation(conversationId) {
      return get(/databases/$(database)/documents/conversation/$(conversationId));
    }

    function isConversationParticipant(conversationId) {
      return isSignedIn()
        && getConversation(conversationId).data.participants.hasAny([request.auth.uid]);
    }

    // --- existing user + property rules remain the same ---
    match /users/{userId} {
      allow read: if true;
      allow create, update: if isOwner(userId) && request.resource.data.uid == userId;
      allow delete: if false;

      match /user_property/{propertyId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && request.resource.data.userUid == userId;
        allow update: if isOwner(userId)
          && resource.data.userUid == userId
          && request.resource.data.userUid == userId;
        allow delete: if isOwner(userId) && resource.data.userUid == userId;
      }

      // Per-user chat metadata (pin state, unread counts, otherUser profile)
      match /Chat/{conversationId} {
        allow read: if isOwner(userId);
        allow create, update: if isOwner(userId);
        allow delete: if false;
      }
    }

    match /property/{propertyId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.userUid == request.auth.uid;
      allow update: if isOwner(resource.data.userUid)
        && request.resource.data.userUid == resource.data.userUid;
      allow delete: if isOwner(resource.data.userUid);
    }

    // Shared one-to-one conversations
    match /conversation/{conversationId} {
      allow create: if isSignedIn()
        && request.resource.data.participants.hasAny([request.auth.uid]);
      allow read: if isConversationParticipant(conversationId);
      allow update: if isConversationParticipant(conversationId)
        && (!request.resource.data.keys().hasAny(['participants'])
          || request.resource.data.participants == resource.data.participants);
      allow delete: if false;

      match /messages/{messageId} {
        allow read: if isConversationParticipant(conversationId);
        allow create: if isConversationParticipant(conversationId)
          && request.resource.data.senderId == request.auth.uid;
        allow update, delete: if false;
      }
    }
  }
}
```

The helper functions reuse your existing ownership checks and guarantee that
only the two `participants` stored in the conversation document can read shared
metadata or post messages.

## Storage rules

Chat attachments are uploaded to `chat/{conversationId}/{fileId}` in Firebase
Storage. Restrict access to authenticated participants of the same
conversation.

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isConversationParticipant(conversationId) {
      return isSignedIn()
        && get(/databases/(default)/documents/conversation/$(conversationId))
             .data.participants.hasAny([request.auth.uid]);
    }

    match /chat/{conversationId}/{fileId} {
      allow read, write: if isConversationParticipant(conversationId);
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy these rules through the Firebase console or CLI to remove the
`permission-denied` errors when creating conversations, subscribing to history,
or sending new messages from the DreamHome chat panel.
