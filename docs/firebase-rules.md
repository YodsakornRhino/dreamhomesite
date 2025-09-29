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

    function uid() {
      return request.auth.uid;
    }

    function isOwnerByUid(userId) {
      return isSignedIn() && uid() == userId;
    }

    function hasOwnerRef(data) {
      return data.userRef is document && data.userRef.path.size() == 2 && data.userRef.path[0] == "users";
    }

    function isOwnerByRef(data) {
      return hasOwnerRef(data) && uid() == data.userRef.id;
    }

    function isConversationParticipant(participantIds) {
      return isSignedIn() && participantIds is list && participantIds.hasAny([uid()]);
    }

    match /users/{userId} {
      allow read: if true;
      allow create, update: if isOwnerByUid(userId) && request.resource.data.uid == userId;
      allow delete: if false;

      match /user_property/{propertyId} {
        allow read, create, update, delete: if isOwnerByUid(userId);
      }
    }

    match /property/{propertyId} {
      allow read: if true;
      allow create: if isOwnerByUid(request.resource.data.userUid);
      allow update: if (
        isOwnerByUid(resource.data.userUid) && request.resource.data.userUid == resource.data.userUid
      ) || isOwnerByRef(resource.data) || isOwnerByRef(request.resource.data);
      allow delete: if isOwnerByUid(resource.data.userUid) || isOwnerByRef(resource.data);
    }

    match /users/{userId}/properties/{propertyId} {
      allow read, write: if isOwnerByUid(userId);
    }

    match /conversations/{conversationId} {
      allow read, update, delete: if isConversationParticipant(resource.data.participantIds);
      allow create: if isConversationParticipant(request.resource.data.participantIds)
        && request.resource.data.participantIds is list
        && request.resource.data.participantIds.size() >= 2;

      match /messages/{messageId} {
        allow create: if isConversationParticipant(get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds)
          && request.resource.data.senderId == uid()
          && request.resource.data.text is string && request.resource.data.text.size() > 0;
        allow read: if isConversationParticipant(get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds);
        allow update, delete: if false;
      }
    }
  }
}
```

**Why these changes?**

* `allow delete` now accepts either `resource.data.userUid` or the new `userRef` field, so existing documents without the backfill can still be deleted.
* `allow update` also trusts either `userUid` on the incoming write or the stored `userRef`, which lets your migration write the new `userRef` without being blocked.
* `isOwnerByRef` confirms the `userRef` actually points at `/users/{uid}` and compares the document ID to the signed-in user.
* The `/conversations` section locks down chat threads so only participants can read and write them, while ensuring each message is authored by the signed-in sender.

Once all property documents contain a valid `userRef`, you can simplify the rule by removing the `userUid` fallback.

## Cloud Storage (`storage.rules`)

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    match /propertyImages/{propertyId}/{allPaths=**} {
      allow read: if true;
      allow write: if isSignedIn();
      allow delete: if isSignedIn();
    }
  }
}
```

Replace the `allow delete` condition with whatever folder structure you actually use in Storage. The crucial part is verifying that the caller owns the listing—if you mirror Firestore ownership, fetch the property document with `get(/databases/(default)/documents/property/$(propertyId))` and check the same `userUid` / `userRef` combination before deleting files.

After updating the rules in the Firebase console (or deploying via the CLI), retry the deletion flow from the Sell page. With the rules accepting both owner identifiers, Firestore should authorize the delete operation initiated by the updated UI.
