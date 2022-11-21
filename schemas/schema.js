const { gql } = require('apollo-server')

const typeDefs = gql`
	type Query {
		comment: [Comment] @cacheControl(maxAge: 300)
	}

	type Comment @cacheControl(maxAge: 300) {
		id: ID!
		commentId: ID!
		description: String!
	}
`

module.exports = typeDefs