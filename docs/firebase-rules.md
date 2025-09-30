# Firebase Security Rule Updates for Property Deletion

This project expects both Firestore and Cloud Storage security rules to allow a signed-in owner to delete their property listing. The following snippets extend the rules from the screenshots you shared so deletes succeed for both new and legacy documents.

## Cloud Firestore (`firestore.rules`)

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwnerByUid(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function hasOwnerRef(data) {
      return data.userRef is document && data.userRef.path.size() == 2 && data.userRef.path[0] == "users";
    }

    function isOwnerByRef(data) {
      return hasOwnerRef(data) && request.auth.uid == data.userRef.id;
    }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwnerByUid(userId);
    }

    match /property/{propertyId} {
      allow read: if true;
      allow create: if isOwnerByUid(request.resource.data.userUid);
      allow update: if isOwnerByUid(request.resource.data.userUid) || isOwnerByRef(resource.data) || isOwnerByRef(request.resource.data);
      allow delete: if isOwnerByUid(resource.data.userUid) || isOwnerByRef(resource.data);
    }

    match /users/{userId}/properties/{propertyId} {
      allow read, write: if isOwnerByUid(userId);
    }
  }
}
```

**Why these changes?**

* `allow delete` now accepts either `resource.data.userUid` or the new `userRef` field, so existing documents without the backfill can still be deleted.
* `allow update` also trusts either `userUid` on the incoming write or the stored `userRef`, which lets your migration write the new `userRef` without being blocked.
* `isOwnerByRef` confirms the `userRef` actually points at `/users/{uid}` and compares the document ID to the signed-in user.

Once all property documents contain a valid `userRef`, you can simplify the rule by removing the `userUid` fallback.

## Cloud Storage (`storage.rules`)

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    /* Helpers */
    function isSignedIn() {
      return request.auth != null;
    }


    // Pair-style chat ids look like "uidA__uidB" for 1:1 threads
    function chatIdPairsWithMe(chatId) {
      return isSignedIn()
        && (
          chatId == request.auth.uid
          || chatId.matches('^' + request.auth.uid + '__[^/]+$')
          || chatId.matches('^[^/]+__' + request.auth.uid + '$')
        );
    }

    // Fall back to Firestore chat documents to confirm membership
    function isInChatDoc(chatId) {
      return isSignedIn()
        && exists(/databases/(default)/documents/chats/$(chatId))
        && let chat = get(/databases/(default)/documents/chats/$(chatId));
           (
             (
               chat.data.participants is list
               && chat.data.participants.hasAny([request.auth.uid])
             ) || (
               chat.data.participantIds is list
               && chat.data.participantIds.hasAny([request.auth.uid])
             )
           );
    }

    function isChatParticipant(chatId) {
      return isInChatDoc(chatId) || chatIdPairsWithMe(chatId);

    }

    match /propertyImages/{propertyId}/{allPaths=**} {
      allow read: if true;
      allow write: if isSignedIn(); // write = create/update/delete
    }

    match /chat-attachments/{chatId}/{allPaths=**} {
      allow read, write: if isChatParticipant(chatId);

      // If you need to restrict types, add:
      // allow write: if isChatParticipant(chatId)
      //              && request.resource.contentType.matches('image/.*|application/pdf');
    }

    match /chat-attachments/{chatId}/{allPaths=**} {
      allow read, write, delete: if isChatParticipant(chatId);
    }
  }
}
```

With these changes, the existing property image permissions remain intact while chat attachments stored under `chat-attachments/{chatId}` are only accessible to authenticated participants in that conversation.
