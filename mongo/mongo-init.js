db.createUser(
  {
      user: "app-user",
      pwd: "password",
      roles: [
          {
              role: "readWrite",
              db: "comment"
          }
      ]
  }
);
db = db.getSiblingDB('comment');
db["comments"].drop();
db["comments"].insertMany([
  {
    "commentId": "1",
    "description": "The perfect account for your everyday needs"
  },
]);