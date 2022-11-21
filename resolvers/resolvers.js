const { mapComment } = require("./mappers")
const baseURL = `http://localhost:5000/api/comment`
module.exports = {
  Query: {
    comment: (_, __, context) => 
      context.commentsDataSource.findAll().then((comments) => 
        comments.map((comment) => mapComment(comment))
      ),
  },
  // Mutation: {
  //   // create: () =>
  //   // delete: () =>
  // }
}